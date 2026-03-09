/**
 * ProjectOverview — displays repo-level overview and tech stack.
 */

import { FiGitBranch, FiLayers, FiRefreshCw } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import TechStackCard from "./TechStackCard";
import { repoAPI } from "../../api/client";
import { useNavigate } from "react-router-dom";

export default function ProjectOverview({ repo }) {
    const navigate = useNavigate();
    if (!repo) return null;

    const handleReset = async () => {
        if (window.confirm("This will wipe all currently mapped skeletons and cache for this repo. You will need to re-analyze it. Proceed?")) {
            try {
                await repoAPI.reset(repo.id);
                navigate("/");
            } catch (err) {
                alert("Failed to reset: " + err.message);
            }
        }
    };

    let techStack = {};
    try {
        techStack = typeof repo.tech_stack === "string" ? JSON.parse(repo.tech_stack) : repo.tech_stack || {};
    } catch {
        techStack = {};
    }

    return (
        <div className="p-8 space-y-8 overflow-y-auto bg-bg-primary font-sans h-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-accent/15 pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#10b981] flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <FiGitBranch className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#f0f6ff] font-display tracking-tight">{repo.repo_name}</h2>
                        <p className="text-sm font-mono text-accent mt-1 tracking-wide">{repo.total_files} FILES ANALYZED</p>
                    </div>
                </div>

                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ef4444]/30 text-[#ef4444] text-xs font-mono uppercase tracking-widest hover:bg-[#ef4444]/10 transition-all"
                >
                    <FiRefreshCw size={14} /> Re-analyze Repo
                </button>
            </div>

            {/* Overview */}
            {repo.project_overview && (
                <div className="bg-[#0a1428]/80 border border-accent/20 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md">
                    <h3 className="flex items-center gap-2 text-[0.95rem] font-semibold text-[#e2e8f0] mb-4 font-display uppercase tracking-wider">
                        <FiLayers size={16} className="text-accent" /> Project Overview
                    </h3>
                    <div className="prose prose-invert prose-sm max-w-none 
                        prose-p:leading-[1.7] prose-p:text-[#b0bfd4] 
                        prose-code:text-accent-hover prose-code:bg-black/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                        prose-pre:bg-black/50 prose-pre:border prose-pre:border-accent/15 prose-pre:rounded-xl prose-pre:my-3 prose-pre:p-4
                        prose-strong:text-white prose-strong:font-bold
                    ">
                        <ReactMarkdown>{repo.project_overview}</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Tech Stack */}
            <TechStackCard techStack={techStack} />
        </div>
    );
}
