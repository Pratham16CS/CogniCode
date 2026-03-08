/**
 * HomePage — Dashboard for submitting repos and viewing past analyses.
 * Redesigned with CRT and Glassmorphism UI.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiGithub, FiClock, FiCheck, FiAlertTriangle, FiLoader, FiArrowRight } from "react-icons/fi";
import useAppStore from "../store/appStore";
import { useRepository } from "../hooks/useRepository";
import { repoAPI } from "../api/client";
import { useAuth } from "../hooks/useAuth";

const statusColors = {
    pending: "text-[#8fa3bf]",
    cloning: "text-[#f59e0b]",
    indexing: "text-accent",
    ready: "text-[#22c55e]",
    error: "text-[#ef4444]",
};

const statusIcons = {
    pending: <FiClock />,
    cloning: <FiLoader className="animate-spin" />,
    indexing: <FiLoader className="animate-spin" />,
    ready: <FiCheck />,
    error: <FiAlertTriangle />,
};

export default function HomePage() {
    const [repoUrl, setRepoUrl] = useState("");
    const [githubPat, setGithubPat] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const { repos, setRepos, analysisStatus, analysisProgress } = useAppStore();
    const { submitRepo, startPolling } = useRepository();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Load repos on mount
    useEffect(() => {
        repoAPI.list().then((res) => setRepos(res.data.repositories)).catch(() => { });
    }, [setRepos]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!repoUrl.trim()) return;
        setError("");
        setSubmitting(true);
        try {
            const repo = await submitRepo(repoUrl.trim(), githubPat.trim() || undefined);
            startPolling(repo.id);
            setRepoUrl("");
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to submit repository");
        } finally {
            setSubmitting(false);
        }
    };

    const isProcessing = analysisStatus === "cloning" || analysisStatus === "indexing";
    const pTotal = analysisProgress?.total || 1;
    const pCurrent = analysisProgress?.indexed || 0;
    const pPercent = Math.min(100, Math.round((pCurrent / pTotal) * 100));

    // Calculate ASCII bar length mapping
    const getProgressBar = (percent) => {
        const filled = Math.floor(percent / 10);
        const empty = 10 - filled;
        return `[${'#'.repeat(filled)}${'-'.repeat(empty)}] ${percent}%`;
    };

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col font-sans overflow-x-hidden">

            {/* Header */}
            <header className="fixed top-0 left-0 w-full z-40 bg-bg-primary/80 backdrop-blur-md border-b border-accent/20 px-8 py-4 flex items-center justify-between shadow-sm">
                <div className="font-display font-bold text-lg tracking-wide text-accent-hover select-none flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-[#3b82f6] to-[#10b981] flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                        <FiGithub size={18} className="text-white" />
                    </div>
                    COGNICODE
                </div>
                <div className="flex items-center gap-5">
                    <span className="font-mono text-sm text-[#b0bfd4] tracking-wide">{user?.username}</span>
                    <button
                        onClick={logout}
                        className="text-sm font-semibold text-[#8fa3bf] hover:text-[#ef4444] transition-colors bg-transparent border-none cursor-pointer"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-28 flex flex-col items-center">

                {/* Submit Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-[900px] mb-16 relative"
                >
                    <div className="bg-gradient-to-br from-accent/5 to-[#0f1c38]/80 border border-accent/20 rounded-3xl p-10 md:p-14 w-full shadow-[0_8px_40px_rgba(0,0,0,0.4)] relative overflow-hidden backdrop-blur-md">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-[radial-gradient(ellipse,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none"></div>

                        <div className="font-mono text-xs text-accent tracking-[2px] uppercase mb-4 text-center">// CORE ENGINE</div>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#f0f6ff] mb-4 text-center font-display tracking-tight">
                            Decode a <span className="text-accent italic">Repository</span>
                        </h2>
                        <p className="text-[#8fa3bf] text-center mb-10 max-w-lg mx-auto text-[1.05rem]">
                            Enter any public GitHub URL. CogniCode will clone the codebase, build a concept graph, and generate logical skeletons.
                        </p>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-[600px] mx-auto relative z-10">
                            <div className="flex flex-col md:flex-row gap-3 bg-[#050f23]/80 border border-accent/30 rounded-xl p-2.5 focus-within:border-accent focus-within:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all">
                                <div className="flex-1 flex items-center gap-2 pl-3">
                                    <FiGithub className="text-accent/60" size={18} />
                                    <input
                                        type="url"
                                        placeholder="https://github.com/owner/repo"
                                        value={repoUrl}
                                        onChange={(e) => setRepoUrl(e.target.value)}
                                        required
                                        className="w-full bg-transparent border-none outline-none font-mono text-[0.95rem] text-[#e2e8f0] caret-accent placeholder-[#475569]"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting || isProcessing}
                                    className="w-full md:w-auto bg-accent text-white border-none rounded-lg px-7 py-3 font-sans text-[0.9rem] font-semibold cursor-pointer whitespace-nowrap transition-all hover:bg-[#2563eb] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? <><FiLoader className="animate-spin" /> FETCHING</> : "ANALYSE →"}
                                </button>
                            </div>

                            <details className="group px-2">
                                <summary className="font-mono text-xs text-accent/60 cursor-pointer hover:text-accent select-none list-none uppercase tracking-wider flex items-center gap-2">
                                    <span className="group-open:rotate-90 transition-transform">▸</span> GitHub PAT (Private Repos)
                                </summary>
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                                    <input
                                        type="password"
                                        placeholder="ghp_xxxxxxxxxxxx"
                                        value={githubPat}
                                        onChange={(e) => setGithubPat(e.target.value)}
                                        className="w-full bg-[#050f23]/60 border border-accent/20 rounded-lg px-4 py-2.5 font-mono text-[0.85rem] text-[#e2e8f0] placeholder-[#475569] outline-none focus:border-accent/60"
                                    />
                                </motion.div>
                            </details>

                            {error && (
                                <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg p-3 text-sm text-[#ef4444] flex items-center gap-2">
                                    <FiAlertTriangle size={16} /> {error}
                                </div>
                            )}
                        </form>

                        {/* Animated CRT Terminal UI for Processing State */}
                        <AnimatePresence>
                            {isProcessing && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="pt-10 max-w-[600px] mx-auto"
                                >
                                    <div className="bg-[#010610] border border-accent/40 rounded-xl p-5 shadow-[inset_0_0_20px_rgba(0,0,0,0.9),0_0_15px_rgba(59,130,246,0.3)] relative overflow-hidden">
                                        {/* CRT Overlay Effects */}
                                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-40 z-10 mix-blend-overlay"></div>
                                        <div className="absolute inset-0 pointer-events-none border border-accent/20 rounded-xl z-20"></div>

                                        <div className="relative z-30 font-mono text-[#7dd3fc] text-sm leading-relaxed text-shadow-[0_0_8px_rgba(125,211,252,0.8)]">
                                            <div className="mb-2 uppercase text-xs tracking-widest text-[#60a5fa]">{analysisStatus} ENGINE ACTIVE...</div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span>PROGRESS:</span>
                                                <span>{pCurrent} / {pTotal} FILES</span>
                                            </div>
                                            <div className="mb-2 text-accent-hover tracking-widest text-shadow-[0_0_10px_rgba(59,130,246,0.8)]">
                                                {getProgressBar(pPercent)}
                                            </div>
                                            <div className="text-xs text-accent/60 flex items-center gap-2 animate-pulse">
                                                <div className="w-1.5 h-3 bg-accent/60"></div>
                                                PROCESSING DEPENDENCIES...
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* History Section */}
                {repos.length > 0 && (
                    <div className="w-full max-w-[900px]">
                        <div className="font-mono text-xs text-accent tracking-[2px] uppercase mb-5 flex items-center gap-2">
                            // ANALYSIS HISTORY <span className="h-px bg-accent/20 flex-1 ml-4"></span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {repos.map((repo, i) => (
                                <motion.div
                                    key={repo.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => repo.status === "ready" && navigate(`/editor/${repo.id}`)}
                                    className={`
                                        bg-[#0a1428]/60 border border-accent/15 rounded-xl p-5 flex flex-col gap-4 backdrop-blur-sm transition-all duration-300
                                        ${repo.status === "ready" ? "cursor-pointer hover:border-accent/50 hover:bg-[#0f1c38]/80 hover:shadow-[0_5px_20px_rgba(59,130,246,0.15)] group" : "opacity-80"}
                                    `}
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <FiGithub className="text-accent/60" size={16} />
                                            <h3 className="font-display font-semibold text-[#f0f6ff] text-base truncate">
                                                {repo.repo_name}
                                            </h3>
                                        </div>
                                        <p className="font-sans text-xs text-[#64748b]">
                                            Analyzed on {new Date(repo.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-accent/10">
                                        <span className={`font-mono text-[0.7rem] uppercase tracking-wider flex items-center gap-1.5 ${statusColors[repo.status]}`}>
                                            {statusIcons[repo.status]} {repo.status}
                                        </span>
                                        {repo.status === "ready" && (
                                            <span className="text-accent/0 group-hover:text-accent transition-colors flex items-center text-sm">
                                                OPEN <FiArrowRight className="ml-1" />
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
