"""Language detection service — identifies programming languages by extension and content patterns."""

import os
from typing import Optional, Dict, List

# Extension → language mapping for supported languages
EXTENSION_MAP: Dict[str, str] = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".java": "java",
    ".c": "c",
    ".h": "c",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".cxx": "cpp",
    ".hpp": "cpp",
    ".hxx": "cpp",
    ".html": "html",
    ".htm": "html",
    ".css": "css",
    ".scss": "scss",
    ".sass": "sass",
    ".go": "go",
    ".rs": "rust",
    ".rb": "ruby",
    ".php": "php",
    ".swift": "swift",
    ".kt": "kotlin",
    ".kts": "kotlin",
    ".scala": "scala",
    ".r": "r",
    ".R": "r",
    ".sql": "sql",
    ".sh": "shell",
    ".bash": "shell",
    ".zsh": "shell",
    ".ps1": "powershell",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".json": "json",
    ".xml": "xml",
    ".md": "markdown",
    ".toml": "toml",
    ".ini": "ini",
    ".cfg": "ini",
    ".vue": "vue",
    ".svelte": "svelte",
    ".dart": "dart",
    ".lua": "lua",
    ".zig": "zig",
}

# Languages the system has deep expertise in (for skeleton generation)
EXPERT_LANGUAGES = {
    "python", "javascript", "typescript", "java", "c", "cpp",
    "html", "css", "go", "rust",
}

# Files to skip during analysis
SKIP_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2",
    ".ttf", ".eot", ".mp3", ".mp4", ".webm", ".webp", ".pdf", ".zip",
    ".tar", ".gz", ".lock", ".min.js", ".min.css", ".map",
}

SKIP_DIRS = {
    ".git", "node_modules", "__pycache__", ".next", "dist", "build",
    ".venv", "venv", "env", ".env", ".idea", ".vscode", "vendor",
    "target", ".gradle", "bin", "obj", ".tox", ".mypy_cache",
    ".pytest_cache", "coverage", ".nyc_output",
}

SKIP_FILES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "Pipfile.lock",
    "poetry.lock", "composer.lock", "Gemfile.lock", "Cargo.lock",
}


def detect_language(file_path: str) -> Optional[str]:
    """Detect programming language from file extension."""
    _, ext = os.path.splitext(file_path)
    return EXTENSION_MAP.get(ext.lower())


def is_expert_language(language: str) -> bool:
    """Check if the language is one we have deep expertise in."""
    return language in EXPERT_LANGUAGES


def should_skip_file(file_path: str) -> bool:
    """Determine if a file should be skipped during analysis."""
    basename = os.path.basename(file_path)

    # Skip known non-code files
    if basename in SKIP_FILES:
        return True

    _, ext = os.path.splitext(file_path)
    if ext.lower() in SKIP_EXTENSIONS:
        return True

    return False


def should_skip_dir(dir_name: str) -> bool:
    """Determine if a directory should be skipped."""
    return dir_name in SKIP_DIRS


def get_language_prompt_context(language: str) -> str:
    """Return language-specific context for LLM prompts to improve analysis quality."""
    contexts = {
        "python": "Python: Focus on decorators, generators, context managers, type hints, and Pythonic patterns. Watch for unnecessary __init__ boilerplate, redundant pass statements, and unused imports.",
        "javascript": "JavaScript: Focus on closures, promises/async-await, event-driven patterns, and module exports. Watch for console.logs, unused variable declarations, and redundant polyfills.",
        "typescript": "TypeScript: Focus on type definitions, generics, interfaces, decorators, and discriminated unions. Watch for overly verbose type annotations that TypeScript can infer.",
        "java": "Java: Focus on design patterns (Factory, Builder, Observer), generics, streams, and dependency injection. Watch for excessive boilerplate getters/setters, redundant null checks, and unused imports.",
        "c": "C: Focus on memory management patterns, pointer arithmetic, struct designs, and system-level algorithms. Watch for redundant includes, unused macros, and boilerplate error handling.",
        "cpp": "C++: Focus on RAII, smart pointers, templates, STL usage, and move semantics. Watch for unnecessary copies, redundant includes, and boilerplate constructors/destructors.",
        "html": "HTML: Focus on semantic structure, accessibility patterns, and component organization. Watch for redundant div wrappers, inline styles, and deprecated tags.",
        "css": "CSS: Focus on layout systems (Grid, Flexbox), custom properties, and selector specificity. Watch for redundant declarations, unused rules, and overly specific selectors.",
        "go": "Go: Focus on goroutines, channels, interfaces, error handling patterns, and struct embedding. Watch for unused imports (Go compiler catches these), redundant error checks, and boilerplate.",
        "rust": "Rust: Focus on ownership/borrowing, pattern matching, trait implementations, and lifetime annotations. Watch for unnecessary clones, redundant type annotations, and boilerplate derives.",
    }
    return contexts.get(language, f"{language}: Analyze core logic, algorithms, and design patterns. Remove mechanical boilerplate and noise.")


def scan_repo_languages(repo_path: str) -> Dict[str, int]:
    """Scan a repository and return language distribution (language → file count)."""
    lang_counts: Dict[str, int] = {}

    for root, dirs, files in os.walk(repo_path):
        # Filter out skip directories in-place
        dirs[:] = [d for d in dirs if not should_skip_dir(d)]

        for fname in files:
            fpath = os.path.join(root, fname)
            if should_skip_file(fpath):
                continue
            lang = detect_language(fpath)
            if lang:
                lang_counts[lang] = lang_counts.get(lang, 0) + 1

    return lang_counts


def get_analyzable_files(repo_path: str) -> List[str]:
    """Return list of relative file paths that should be analyzed."""
    files = []
    for root, dirs, filenames in os.walk(repo_path):
        dirs[:] = [d for d in dirs if not should_skip_dir(d)]
        for fname in filenames:
            fpath = os.path.join(root, fname)
            if should_skip_file(fpath):
                continue
            lang = detect_language(fpath)
            if lang:
                rel_path = os.path.relpath(fpath, repo_path)
                files.append(rel_path)
    return sorted(files)
