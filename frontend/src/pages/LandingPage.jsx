/**
 * LandingPage — public landing page for CogniCode web app.
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiCode, FiZap, FiBookOpen, FiMessageSquare, FiArrowRight } from "react-icons/fi";

const features = [
    {
        icon: <FiZap size={24} />,
        title: "Logical Skeletons",
        desc: "Strip away mechanical bloat to expose core algorithms and design patterns.",
    },
    {
        icon: <FiBookOpen size={24} />,
        title: "Learning Notebooks",
        desc: "Contextual explanations, removal logs, and deep-dive notes for every file.",
    },
    {
        icon: <FiMessageSquare size={24} />,
        title: "AI Code Tutor",
        desc: "Ask questions about any file and get instant, context-aware explanations.",
    },
    {
        icon: <FiCode size={24} />,
        title: "Dual Editor View",
        desc: "Compare original source with its simplified skeleton side-by-side.",
    },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-bg-primary">
            {/* Nav */}
            <nav className="flex items-center justify-between px-8 py-5 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-skeleton flex items-center justify-center">
                        <FiCode size={18} className="text-white" />
                    </div>
                    <span className="text-xl font-bold text-text-primary">CogniCode</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        to="/login"
                        className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                        Sign In
                    </Link>
                    <Link
                        to="/login?register=true"
                        className="px-5 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="max-w-5xl mx-auto px-8 pt-24 pb-16 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-border text-sm text-text-secondary">
                        <span className="w-2 h-2 rounded-full bg-skeleton animate-pulse" />
                        Powered by AWS Bedrock
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
                        <span className="text-text-primary">Understand any codebase</span>
                        <br />
                        <span className="bg-gradient-to-r from-accent to-skeleton bg-clip-text text-transparent">
                            in minutes, not weeks
                        </span>
                    </h1>
                    <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
                        CogniCode distills GitHub repositories into logical skeletons, stripping away
                        boilerplate to expose the algorithms, patterns, and design decisions that matter.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link
                            to="/login?register=true"
                            className="inline-flex items-center gap-2 px-7 py-3 text-base font-medium text-white bg-accent hover:bg-accent-hover rounded-xl transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40"
                        >
                            Start Learning <FiArrowRight />
                        </Link>
                        <a
                            href="#features"
                            className="inline-flex items-center gap-2 px-7 py-3 text-base font-medium text-text-secondary border border-border hover:border-border-light rounded-xl transition-colors"
                        >
                            See How It Works
                        </a>
                    </div>
                </motion.div>
            </section>

            {/* Features */}
            <section id="features" className="max-w-5xl mx-auto px-8 py-20">
                <h2 className="text-2xl font-bold text-center text-text-primary mb-12">
                    Everything you need to deeply understand code
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.4 }}
                            viewport={{ once: true }}
                            className="glass-card p-6 hover:border-accent/40 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                                {f.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">{f.title}</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border px-8 py-6 text-center text-sm text-text-muted">
                CogniCode — Built for developers who want to understand, not just read.
            </footer>
        </div>
    );
}
