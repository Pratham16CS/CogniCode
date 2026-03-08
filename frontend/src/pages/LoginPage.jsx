/**
 * LoginPage — handles both Login and Register flows.
 */

import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiCode, FiMail, FiLock, FiUser, FiAlertCircle } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
    const [searchParams] = useSearchParams();
    const [isRegister, setIsRegister] = useState(searchParams.get("register") === "true");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (isRegister) {
                await register(email, username, password);
            } else {
                await login(email, password);
            }
        } catch (err) {
            setError(err.response?.data?.detail || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-skeleton flex items-center justify-center">
                        <FiCode size={22} className="text-white" />
                    </div>
                    <span className="text-2xl font-bold text-text-primary">CogniCode</span>
                </Link>

                <div className="glass-card p-8">
                    <h2 className="text-xl font-bold text-text-primary text-center mb-1">
                        {isRegister ? "Create your account" : "Welcome back"}
                    </h2>
                    <p className="text-sm text-text-secondary text-center mb-6">
                        {isRegister ? "Start understanding code deeply" : "Sign in to continue"}
                    </p>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm"
                            >
                                <FiAlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div className="relative">
                            <FiMail className="absolute left-3 top-3.5 text-text-muted" size={16} />
                            <input
                                id="input-email"
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 bg-bg-primary border border-border rounded-lg text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                            />
                        </div>

                        {/* Username (Register only) */}
                        <AnimatePresence>
                            {isRegister && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="relative"
                                >
                                    <FiUser className="absolute left-3 top-3.5 text-text-muted" size={16} />
                                    <input
                                        id="input-username"
                                        type="text"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required={isRegister}
                                        className="w-full pl-10 pr-4 py-3 bg-bg-primary border border-border rounded-lg text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Password */}
                        <div className="relative">
                            <FiLock className="absolute left-3 top-3.5 text-text-muted" size={16} />
                            <input
                                id="input-password"
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full pl-10 pr-4 py-3 bg-bg-primary border border-border rounded-lg text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                            />
                        </div>

                        <button
                            id="btn-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
                        </button>
                    </form>

                    <p className="text-sm text-text-secondary text-center mt-6">
                        {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
                        <button
                            onClick={() => { setIsRegister(!isRegister); setError(""); }}
                            className="text-accent hover:text-accent-hover font-medium transition-colors"
                        >
                            {isRegister ? "Sign In" : "Create one"}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
