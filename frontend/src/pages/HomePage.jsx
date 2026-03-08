/**
 * HomePage — Dashboard for submitting repos and viewing past analyses.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiGithub, FiSearch, FiClock, FiCheck, FiAlertTriangle, FiLoader, FiArrowRight } from "react-icons/fi";
import useAppStore from "../store/appStore";
import { useRepository } from "../hooks/useRepository";
import { repoAPI } from "../api/client";
import { useAuth } from "../hooks/useAuth";

const statusColors = {
    pending: "text-text-muted",
    cloning: "text-warning",
    indexing: "text-accent",
    ready: "text-success",
    error: "text-error",
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

    return (
        <div className="min-h-screen bg-bg-primary">
            {/* Header */}
            <header className="flex items-center justify-between px-8 py-4 border-b border-border">
                <h1 className="text-lg font-bold text-text-primary">CogniCode</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-text-secondary">{user?.username}</span>
                    <button
                        onClick={logout}
                        className="text-sm text-text-muted hover:text-error transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12">
                {/* Submit Card */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 mb-10"
                >
                    <h2 className="text-xl font-bold text-text-primary mb-1">Analyze a Repository</h2>
                    <p className="text-sm text-text-secondary mb-6">
                        Paste a GitHub repository URL to generate its logical skeleton.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <FiGithub className="absolute left-3 top-3.5 text-text-muted" size={16} />
                            <input
                                id="input-repo-url"
                                type="url"
                                placeholder="https://github.com/owner/repo"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 bg-bg-primary border border-border rounded-lg text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                            />
                        </div>

                        <details className="group">
                            <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary">
                                + GitHub PAT (optional — for private repos)
                            </summary>
                            <input
                                type="password"
                                placeholder="ghp_xxxxxxxxxxxx"
                                value={githubPat}
                                onChange={(e) => setGithubPat(e.target.value)}
                                className="w-full mt-2 px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                            />
                        </details>

                        {error && (
                            <p className="text-sm text-error flex items-center gap-1.5">
                                <FiAlertTriangle size={14} /> {error}
                            </p>
                        )}

                        <button
                            id="btn-analyze"
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <><FiLoader className="animate-spin" /> Submitting...</>
                            ) : (
                                <><FiSearch size={16} /> Analyze Repository</>
                            )}
                        </button>
                    </form>

                    {/* Progress */}
                    {(analysisStatus === "cloning" || analysisStatus === "indexing") && (
                        <div className="mt-6 p-4 rounded-lg bg-bg-primary border border-border">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-text-secondary capitalize">{analysisStatus}...</span>
                                <span className="text-xs text-text-muted">
                                    {analysisProgress.indexed}/{analysisProgress.total} files
                                </span>
                            </div>
                            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-accent to-skeleton rounded-full"
                                    initial={{ width: "5%" }}
                                    animate={{
                                        width: analysisProgress.total > 0
                                            ? `${(analysisProgress.indexed / analysisProgress.total) * 100}%`
                                            : "15%",
                                    }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Recent repos */}
                {repos.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Repositories</h3>
                        <div className="space-y-3">
                            {repos.map((repo, i) => (
                                <motion.div
                                    key={repo.id}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => repo.status === "ready" && navigate(`/editor/${repo.id}`)}
                                    className={`glass-card p-4 flex items-center justify-between ${repo.status === "ready" ? "cursor-pointer hover:border-accent/40" : ""
                                        } transition-colors`}
                                >
                                    <div className="flex items-center gap-3">
                                        <FiGithub className="text-text-muted" size={18} />
                                        <div>
                                            <p className="text-sm font-medium text-text-primary">{repo.repo_name}</p>
                                            <p className="text-xs text-text-muted">
                                                {new Date(repo.updated_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`flex items-center gap-1 text-xs capitalize ${statusColors[repo.status]}`}>
                                            {statusIcons[repo.status]} {repo.status}
                                        </span>
                                        {repo.status === "ready" && <FiArrowRight className="text-text-muted" size={14} />}
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
