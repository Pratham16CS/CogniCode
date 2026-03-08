/**
 * TechStackCard — displays detected languages, frameworks, and build tools.
 */

import { FiCode, FiPackage, FiTool } from "react-icons/fi";

const langColors = {
    python: "#3572A5",
    javascript: "#f1e05a",
    typescript: "#3178c6",
    java: "#b07219",
    c: "#555555",
    cpp: "#f34b7d",
    html: "#e34c26",
    css: "#563d7c",
    go: "#00ADD8",
    rust: "#dea584",
    ruby: "#701516",
    php: "#4F5D95",
    shell: "#89e051",
    markdown: "#083fa1",
    json: "#292929",
    yaml: "#cb171e",
};

export default function TechStackCard({ techStack }) {
    if (!techStack || !Object.keys(techStack).length) return null;

    const languages = techStack.languages || {};
    const frameworks = techStack.frameworks || [];
    const buildTools = techStack.build_tools || [];
    const totalFiles = Object.values(languages).reduce((a, b) => a + b, 0);

    return (
        <div className="glass-card p-5 space-y-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <FiCode size={14} className="text-skeleton" /> Tech Stack
            </h3>

            {/* Language bars */}
            {Object.keys(languages).length > 0 && (
                <div>
                    <p className="text-xs text-text-muted mb-3">Languages</p>
                    {/* Stacked bar */}
                    <div className="h-3 flex rounded-full overflow-hidden mb-3">
                        {Object.entries(languages)
                            .sort(([, a], [, b]) => b - a)
                            .map(([lang, count]) => (
                                <div
                                    key={lang}
                                    className="h-full transition-all"
                                    style={{
                                        width: `${(count / totalFiles) * 100}%`,
                                        backgroundColor: langColors[lang] || "#64748b",
                                        minWidth: "3px",
                                    }}
                                    title={`${lang}: ${count} files`}
                                />
                            ))}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                        {Object.entries(languages)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 8)
                            .map(([lang, count]) => (
                                <span key={lang} className="flex items-center gap-1.5 text-xs text-text-secondary">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: langColors[lang] || "#64748b" }}
                                    />
                                    {lang}
                                    <span className="text-text-muted">({count})</span>
                                </span>
                            ))}
                    </div>
                </div>
            )}

            {/* Frameworks */}
            {frameworks.length > 0 && (
                <div>
                    <p className="flex items-center gap-1.5 text-xs text-text-muted mb-2">
                        <FiPackage size={12} /> Frameworks
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {frameworks.map((fw) => (
                            <span
                                key={fw}
                                className="text-xs px-2.5 py-1 rounded-lg bg-accent/10 text-accent border border-accent/20"
                            >
                                {fw}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Build Tools */}
            {buildTools.length > 0 && (
                <div>
                    <p className="flex items-center gap-1.5 text-xs text-text-muted mb-2">
                        <FiTool size={12} /> Build Tools
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {buildTools.map((tool) => (
                            <span
                                key={tool}
                                className="text-xs px-2.5 py-1 rounded-lg bg-bg-primary text-text-secondary border border-border"
                            >
                                {tool}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
