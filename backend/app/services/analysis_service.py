"""Analysis service — orchestrates the full Map-Reduce indexing pipeline.

Pipeline: Clone → Triage (Groq) → Smart Cache Check → Batch Mapping (Flash) → 
Final Synthesis (Pro) → Store Results
"""

import os
import json
import logging
import asyncio
import hashlib
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.repository import Repository, RepoStatus
from app.models.file_analysis import FileAnalysis
from app.models.notebook import Notebook
from app.models.file_cache import FileCache
from app.services import git_service, skeleton_service, language_service

logger = logging.getLogger(__name__)

# Max file size to analyze (skip huge generated files)
MAX_FILE_SIZE = 100_000  # 100KB
BATCH_SIZE = 5  # Reduced from 25 to avoid LLM output truncation

async def analyze_repository(
    db: AsyncSession,
    repo_url: str,
    user_id: int,
    github_pat: Optional[str] = None,
) -> Repository:
    """
    Full Map-Reduce analysis pipeline for a repository.
    """
    repo_record = await _get_or_create_repo(db, repo_url, user_id)
    repo_record.status = RepoStatus.CLONING
    await db.commit()

    try:
        # Step 1: Clone or pull
        clone_path = await git_service.clone_repo(repo_url, github_pat)
        current_hash = await git_service.get_latest_hash(clone_path)

        # Check full repo cache
        is_cached, cached_repo = await git_service.validate_cache(
            db, repo_url, current_hash, user_id
        )
        if is_cached and cached_repo:
            return cached_repo

        repo_record.clone_path = clone_path
        repo_record.last_commit_hash = current_hash
        repo_record.status = RepoStatus.INDEXING
        await db.commit()

        # Gather base files
        lang_distribution = language_service.scan_repo_languages(clone_path)
        repo_record.detected_languages = json.dumps(lang_distribution)
        tech_stack = _build_tech_stack(lang_distribution, clone_path)
        repo_record.tech_stack = json.dumps(tech_stack)
        
        raw_file_list = language_service.get_analyzable_files(clone_path)
        
        # --- MAP-REDUCE STEP 1: High-Speed Triage ---
        logger.info(f"Triaging {len(raw_file_list)} files via Groq...")
        keep_files, discard_files = await skeleton_service.filter_triage_files(raw_file_list)
        logger.info(f"Triage complete. Keeping {len(keep_files)}, discarding {len(discard_files)}")
        
        repo_record.total_files = len(keep_files)
        repo_record.indexed_files = 0
        await db.commit()

        # Read actual content and check Smart Cache
        files_to_process = []
        cached_results = []
        
        for rel_path in keep_files:
            full_path = os.path.join(clone_path, rel_path)
            try:
                with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
            except IOError:
                continue
                
            if len(content) > MAX_FILE_SIZE or not content.strip():
                continue
                
            # Calculate fingerprint
            file_hash = hashlib.md5(content.encode("utf-8")).hexdigest()
            
            # --- MAP-REDUCE SMART CACHE CHECK ---
            result = await db.execute(
                select(FileCache).where(
                    FileCache.repo_url == repo_url,
                    FileCache.file_path == rel_path,
                    FileCache.file_hash == file_hash
                )
            )
            cache_entry = result.scalar_one_or_none()
            
            if cache_entry:
                logger.info(f"Cache HIT for {rel_path}")
                cached_results.append({
                    "path": rel_path,
                    "content": content,
                    "skeleton": cache_entry.skeleton,
                    "summary": cache_entry.summary,
                    "removal_log": cache_entry.removal_log or "[]",
                    "logical_core": cache_entry.logical_core or cache_entry.summary,
                    "language": language_service.detect_language(rel_path) or "unknown"
                })
            else:
                logger.info(f"Cache MISS for {rel_path}")
                files_to_process.append({
                    "path": rel_path,
                    "content": content,
                    "hash": file_hash,
                    "language": language_service.detect_language(rel_path) or "unknown"
                })

        # --- MAP-REDUCE STEP 2: Parallel Batch Mapping ---
        new_results = []
        for i in range(0, len(files_to_process), BATCH_SIZE):
            batch = files_to_process[i:i + BATCH_SIZE]
            logger.info(f"Batch mapping files {i} to {i+len(batch)}...")
            
            batch_data = [{"path": item["path"], "content": item["content"]} for item in batch]
            llm_results = await skeleton_service.generate_batch_skeletons(batch_data)
            
            # Fallback: If batch mapping failed, try each file in the batch individually
            if not llm_results and batch:
                logger.warning(f"Batch mapping failed for batch starting at index {i}. Falling back to individual processing.")
                llm_results = []
                for single_item in batch_data:
                    # generate_skeleton is more robust for single files
                    logger.info(f"Individual fallback for {single_item['path']}")
                    try:
                        skeleton = await skeleton_service.generate_skeleton(single_item['path'], single_item['content'])
                        core = await skeleton_service.generate_logical_core(single_item['path'], skeleton)
                        log = await skeleton_service.generate_removal_log(single_item['path'], single_item['content'], skeleton)
                        llm_results.append({
                            "path": single_item['path'],
                            "skeleton": skeleton,
                            "summary": "Generated via fallback.", # We could call context generator but it might be overkill
                            "logical_core": core,
                            "removal_log": json.loads(log) if log.startswith("[") else []
                        })
                    except Exception as e:
                        logger.error(f"Fallback failed for {single_item['path']}: {e}")

            # Match LLM results back to our mapped batch
            llm_map = {item["path"]: item for item in llm_results}
            
            for item in batch:
                llm_output = llm_map.get(item["path"], {})
                skeleton = llm_output.get("skeleton", "// Skeleton extraction failed")
                summary = llm_output.get("summary", "No summary available.")
                
                removal_log_val = llm_output.get("removal_log", [])
                if isinstance(removal_log_val, list):
                    removal_log_str = json.dumps(removal_log_val)
                else:
                    removal_log_str = str(removal_log_val)
                    
                logical_core = llm_output.get("logical_core", summary)
                
                # Update Cache
                cache_entry = FileCache(
                    repo_url=repo_url,
                    file_path=item["path"],
                    file_hash=item["hash"],
                    skeleton=skeleton,
                    summary=summary,
                    removal_log=removal_log_str,
                    logical_core=logical_core
                )
                db.add(cache_entry)
                
                new_results.append({
                    "path": item["path"],
                    "content": item["content"],
                    "skeleton": skeleton,
                    "summary": summary,
                    "removal_log": removal_log_str,
                    "logical_core": logical_core,
                    "language": item["language"]
                })
                
            # Update progress
            repo_record.indexed_files += len(batch)
            await db.commit()

        # Combine all results
        all_results = cached_results + new_results

        # --- MAP-REDUCE STEP 3: Synthesis & Insight (Architect) ---
        logger.info("Generating holistic project overview...")
        synthesis_input = []
        for res in all_results:
            synthesis_input.append(f"File: {res['path']}\nSummary: {res['summary']}")
            
        overview = await skeleton_service.generate_project_overview(synthesis_input, tech_stack)
        repo_record.project_overview = overview
        await db.commit()

        # --- DB COMMIT ---
        # Write FileAnalysis and Notebook records
        for res in all_results:
            confidence = skeleton_service.estimate_confidence(res["content"], res["skeleton"])
            
            file_analysis = FileAnalysis(
                repository_id=repo_record.id,
                file_path=res["path"],
                language=res["language"],
                original_content=res["content"],
                skeleton_content=res["skeleton"],
                removal_log=res["removal_log"],
                logical_core=res["logical_core"],
                file_context=res["summary"], # Reusing the batch summary as the file context
                confidence_score=confidence,
            )
            db.add(file_analysis)
            await db.flush()

            notebook = Notebook(
                file_analysis_id=file_analysis.id,
                user_id=repo_record.user_id,
            )
            db.add(notebook)
        
        repo_record.indexed_files = len(all_results)
        repo_record.status = RepoStatus.READY
        await db.commit()

        logger.info(f"Analysis complete for {repo_url}: {len(all_results)} files mapped.")
        return repo_record

    except Exception as e:
        logger.error(f"Analysis failed for {repo_url}: {e}")
        repo_record.status = RepoStatus.ERROR
        repo_record.error_message = str(e)
        await db.commit()
        raise


async def _get_or_create_repo(
    db: AsyncSession, repo_url: str, user_id: int
) -> Repository:
    """Get existing repo record or create a new one."""
    normalized = git_service._normalize_repo_url(repo_url)
    result = await db.execute(
        select(Repository).where(
            Repository.repo_url == normalized,
            Repository.user_id == user_id,
        )
    )
    repo = result.scalar_one_or_none()

    if repo:
        # Clear old analysis data for re-indexing
        repo.status = RepoStatus.PENDING
        repo.error_message = None
        return repo

    repo = Repository(
        user_id=user_id,
        repo_url=normalized,
        repo_name=git_service.extract_repo_name(repo_url),
        status=RepoStatus.PENDING,
    )
    db.add(repo)
    await db.flush()
    return repo


def _build_tech_stack(lang_distribution: dict, clone_path: str) -> dict:
    """Build a tech stack summary from language distribution and config files."""
    tech_stack = {
        "languages": lang_distribution,
        "primary_language": max(lang_distribution, key=lang_distribution.get) if lang_distribution else "unknown",
        "frameworks": [],
        "build_tools": [],
    }

    # Detect frameworks from marker files
    markers = {
        "package.json": ("Node.js / npm",),
        "requirements.txt": ("Python / pip",),
        "Cargo.toml": ("Rust / Cargo",),
        "go.mod": ("Go modules",),
        "pom.xml": ("Java / Maven",),
        "build.gradle": ("Java / Gradle",),
        "Gemfile": ("Ruby / Bundler",),
        "composer.json": ("PHP / Composer",),
        "pubspec.yaml": ("Dart / Flutter",),
        "CMakeLists.txt": ("C/C++ / CMake",),
        "Makefile": ("Make",),
        "Dockerfile": ("Docker",),
        "docker-compose.yml": ("Docker Compose",),
    }

    for marker, tools in markers.items():
        if os.path.exists(os.path.join(clone_path, marker)):
            tech_stack["build_tools"].extend(tools)

    # Detect frontend frameworks
    pkg_path = os.path.join(clone_path, "package.json")
    if os.path.exists(pkg_path):
        try:
            with open(pkg_path, "r") as f:
                pkg = json.load(f)
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            fw_map = {
                "react": "React",
                "vue": "Vue.js",
                "svelte": "Svelte",
                "next": "Next.js",
                "@angular/core": "Angular",
                "express": "Express.js",
                "fastify": "Fastify",
                "tailwindcss": "Tailwind CSS",
            }
            for dep, name in fw_map.items():
                if dep in deps:
                    tech_stack["frameworks"].append(name)
        except (json.JSONDecodeError, IOError):
            pass

    return tech_stack
