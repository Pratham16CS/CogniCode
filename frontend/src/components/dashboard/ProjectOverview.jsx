/**
 * ProjectOverview — displays repo-level overview and tech stack.
 */

import { FiGitBranch, FiLayers } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import TechStackCard from "./TechStackCard";

export default function ProjectOverview({ repo }) {
    if (!repo) return null;

    let techStack = {};
    try {
        techStack = typeof repo.tech_stack === "string" ? JSON.parse(repo.tech_stack) : repo.tech_stack || {};
    } catch {
        techStack = {};
    }

    return (
        <div className="p-6 space-y-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-skeleton flex items-center justify-center">
                    <FiGitBranch className="text-white" size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-text-primary">{repo.repo_name}</h2>
                    <p className="text-xs text-text-muted">{repo.total_files} files analyzed</p>
                </div>
            </div>

            {/* Overview */}
            {repo.project_overview && (
                <div className="glass-card p-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
                        <FiLayers size={14} className="text-accent" /> Project Overview
                    </h3>
                    <div className="prose prose-invert prose-sm max-w-none text-text-secondary leading-relaxed [&_p]:mb-2">
                        <ReactMarkdown>{repo.project_overview}</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Tech Stack */}
            <TechStackCard techStack={techStack} />
        </div>
    );
}
