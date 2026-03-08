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
        <div className="bg-[#0a1428]/80 border border-accent/20 rounded-2xl p-6 space-y-7 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md">
            <h3 className="flex items-center gap-2 text-[0.95rem] font-semibold text-[#e2e8f0] font-display uppercase tracking-wider m-0">
                <FiCode size={16} className="text-[#10b981]" /> Tech Stack
            </h3>

            {/* Language bars */}
            {Object.keys(languages).length > 0 && (
                <div>
                    <p className="text-[0.7rem] uppercase tracking-[2px] font-mono text-[#64748b] mb-3">Languages</p>
                    {/* Stacked bar */}
                    <div className="h-3.5 flex rounded-full overflow-hidden mb-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] border border-bg-primary/50">
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
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                        {Object.entries(languages)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 8)
                            .map(([lang, count]) => (
                                <span key={lang} className="flex items-center gap-2 text-sm text-[#b0bfd4] font-sans">
                                    <span
                                        className="w-3 h-3 rounded-full shadow-[0_0_5px_rgba(0,0,0,0.5)]"
                                        style={{ backgroundColor: langColors[lang] || "#64748b" }}
                                    />
                                    {lang}
                                    <span className="text-[#64748b] font-mono text-xs">({count})</span>
                                </span>
                            ))}
                    </div>
                </div>
            )}

            {/* Frameworks */}
            {frameworks.length > 0 && (
                <div>
                    <p className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[2px] font-mono text-[#64748b] mb-3">
                        <FiPackage size={14} /> Frameworks
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                        {frameworks.map((fw) => (
                            <span
                                key={fw}
                                className="text-[0.85rem] px-3 py-1 rounded-md bg-accent/10 text-accent-hover border border-accent/25 shadow-[0_2px_10px_rgba(59,130,246,0.1)] font-sans"
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
                    <p className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[2px] font-mono text-[#64748b] mb-3">
                        <FiTool size={14} /> Build Tools
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                        {buildTools.map((tool) => (
                            <span
                                key={tool}
                                className="text-[0.85rem] px-3 py-1 rounded-md bg-[#050f23]/60 text-[#b0bfd4] border border-[#374766] shadow-[0_2px_10px_rgba(0,0,0,0.2)] font-sans"
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
