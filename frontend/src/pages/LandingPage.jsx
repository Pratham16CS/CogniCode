/**
 * LandingPage — public landing page for CogniCode web app.
 * Redesigned with custom CRT and 3D animations.
 */

import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function LandingPage() {
    const navigate = useNavigate();
    const sceneRef = useRef(null);

    // CRT Animation State
    const [progress, setProgress] = useState(0);
    const [biosLines, setBiosLines] = useState([
        "COGNICODE ENGINE v1.0.0",
        "REPO: github.com/user/project",
        "CLONING... OK",
        " ",
        "SCANNING STRUCTURE... OK",
        "PARSING DEPENDENCIES...",
        "AI ANALYSIS ACTIVE",
        " ",
        "SIMPLIFYING CODEBASE...",
    ]);
    const [extraLines] = useState([
        "MODULES DETECTED: 14",
        "MAPPING ENTRY POINTS...",
        "BUILDING CONCEPT GRAPH",
        "SIMPLIFYING LOGIC...",
        "LEARN PATH READY.",
        "COGNICODE COMPLETE."
    ]);

    // Simulate terminal progress
    useEffect(() => {
        let currentProgress = 0;
        let lineIndex = 0;
        let timeoutId;

        const tick = () => {
            if (currentProgress <= 100) {
                setProgress(currentProgress);

                if (currentProgress % 20 === 0 && currentProgress > 0 && lineIndex < extraLines.length) {
                    setBiosLines(prev => [...prev, extraLines[lineIndex]]);
                    lineIndex++;
                }

                currentProgress += Math.floor(Math.random() * 5) + 1;
                timeoutId = setTimeout(tick, 150 + Math.random() * 200);
            } else {
                setProgress(100);
                timeoutId = setTimeout(() => {
                    currentProgress = 0;
                    lineIndex = 0;
                    setBiosLines([
                        "FIG MINT ROM v1.0.4",
                        "COPYRIGHT (C) 1984 FIG CORP.",
                        "640 KB OK",
                        " "
                    ]);
                    tick();
                }, 2000);
            }
        };

        timeoutId = setTimeout(tick, 500);
        return () => clearTimeout(timeoutId);
    }, [extraLines]);

    // Format progress bar string
    const getProgressBar = () => {
        const p = Math.min(100, progress);
        const filled = Math.floor(p / 10);
        const empty = 10 - filled;
        return `[${'#'.repeat(filled)}${'-'.repeat(empty)}] ${p}%`;
    };

    // 3D Hover Parallax
    const handleMouseMove = (e) => {
        if (!sceneRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);

        const baseRotY = -20;
        const baseRotX = 8;
        const rotY = baseRotY + dx * 18;
        const rotX = baseRotX - dy * 12;

        sceneRef.current.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;
    };

    const handleMouseLeave = () => {
        if (!sceneRef.current) return;
        sceneRef.current.style.transform = `rotateY(-20deg) rotateX(8deg)`;
    };

    const handleAnalyze = (e) => {
        e.preventDefault();
        navigate("/login?register=true");
    };

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden font-sans flex flex-col items-center w-full">

            {/* FLOATING GLASS NAV */}
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-4rem)] max-w-[1200px] flex items-center justify-between px-7 py-3.5 bg-bg-secondary/55 backdrop-blur-xl border border-accent/25 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]">
                <Link to="/" className="font-display text-[1.15rem] font-bold text-accent-hover tracking-[1px] no-underline">
                    COGNICODE
                </Link>
                <ul className="hidden md:flex gap-8 list-none m-0 p-0">
                    <li><a href="#how-it-works" className="font-sans text-[0.9rem] font-medium text-text-secondary no-underline tracking-[0.3px] transition-colors hover:text-text-primary">HOW IT WORKS</a></li>
                    <li><a href="#features" className="font-sans text-[0.9rem] font-medium text-text-secondary no-underline tracking-[0.3px] transition-colors hover:text-text-primary">FEATURES</a></li>
                </ul>
                <Link to="/login" className="bg-accent/15 border border-accent/50 text-accent-hover px-4 py-2 rounded-lg font-sans text-sm font-semibold transition-all hover:bg-accent/30 hover:shadow-[0_0_18px_rgba(59,130,246,0.3)] no-underline">
                    GET STARTED →
                </Link>
            </nav>

            {/* HERO SECTION */}
            <main className="relative w-full max-w-[1400px] min-h-screen flex flex-col lg:grid lg:grid-cols-[1fr_1.2fr] items-center pt-32 lg:pt-24 px-8 pb-16">

                {/* Content Column */}
                <div className="lg:pl-16 lg:pr-8 z-10 w-full mb-16 lg:mb-0">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <div className="inline-block bg-accent/10 px-4 py-1.5 rounded-md font-mono text-[0.85rem] mb-5 border border-accent/40 text-accent-hover tracking-[0.5px]">
                            COGNICODE // REPO ANALYSER v1.0
                        </div>
                        <h1 className="text-5xl lg:text-[4.5rem] leading-[1] mb-8 tracking-[-2px] font-bold text-[#f0f6ff] font-display">
                            <span>Decode Any</span><br />
                            <span className="italic text-accent">GitHub Repo.</span>
                        </h1>
                        <p className="text-[1.15rem] leading-[1.6] mb-8 max-w-[480px] text-[#b0bfd4] font-normal">
                            Paste a GitHub repo URL and CogniCode will analyse the codebase, identify key components, and simplify it — so you can understand and build it yourself.
                        </p>

                        <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row items-center gap-3 bg-[#0f1c38]/80 border border-accent/30 rounded-lg p-3 mt-8 w-full max-w-[500px]">
                            <input
                                type="text"
                                placeholder="https://github.com/user/repo"
                                className="flex-1 bg-transparent border-none outline-none font-mono text-[0.95rem] text-[#b0bfd4] caret-accent w-full px-2"
                                required
                            />
                            <button type="submit" className="w-full sm:w-auto bg-accent text-white border-none rounded-md px-5 py-2.5 font-sans text-[0.875rem] font-semibold cursor-pointer whitespace-nowrap tracking-[0.3px] transition-all hover:bg-[#2563eb] hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                Analyse →
                            </button>
                        </form>

                        <div className="grid grid-cols-2 gap-6 mt-8">
                            <div className="border-l-2 border-accent pl-4">
                                <h4 className="uppercase text-[0.7rem] tracking-[1.5px] text-accent-hover font-sans font-semibold m-0">Repo Analysis</h4>
                                <p className="font-sans text-[0.9rem] text-[#8fa3bf] mt-1 font-normal m-0">AI-Powered</p>
                            </div>
                            <div className="border-l-2 border-accent pl-4">
                                <h4 className="uppercase text-[0.7rem] tracking-[1.5px] text-accent-hover font-sans font-semibold m-0">Learn Mode</h4>
                                <p className="font-sans text-[0.9rem] text-[#8fa3bf] mt-1 font-normal m-0">Step-by-step</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* 3D Product Column */}
                <div
                    className="flex justify-center items-center h-[500px] lg:h-full relative w-full perspective-[2000px] product-col"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="scene" ref={sceneRef}>
                        <div className="computer-unit">
                            <div className="face front">
                                <div className="screen-inset">
                                    <div className="crt flicker">
                                        <div className="scanline"></div>
                                        <div className="crt-content">
                                            <div id="bios-text">
                                                {biosLines.map((line, idx) => (
                                                    <div key={idx} className="bios-line">{line}</div>
                                                ))}
                                            </div>
                                            <div className="progress-container">
                                                <div className="bios-line">GENERATING LEARN PATH:</div>
                                                <div className="ascii-bar" id="progress-bar">
                                                    {getProgressBar()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="logo-badge"></div>
                                <div className="floppy-slot"></div>
                            </div>
                            <div className="face back"></div>
                            <div className="face left"></div>
                            <div className="face right"></div>
                            <div className="face top"></div>
                            <div className="face bottom"></div>

                            <div className="keyboard-assembly">
                                <div className="kb-base">
                                    <div className="keys-grid">
                                        {[...Array(24)].map((_, i) => (
                                            <div key={i} className="key"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* DIVIDER */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent max-w-[1400px]"></div>

            {/* HOW IT WORKS */}
            <section id="how-it-works" className="w-full max-w-[1400px] py-24 px-8 lg:px-16">
                <div className="font-mono text-[0.8rem] text-accent tracking-[3px] uppercase mb-4">// PROCESS</div>
                <h2 className="text-[3rem] font-bold leading-[1.05] tracking-[-1px] text-[#f0f6ff] mb-4 font-display">How It Works</h2>
                <p className="text-[1.05rem] text-[#8fa3bf] max-w-[600px] leading-[1.65] mb-16 font-normal">Three steps to understanding any codebase, no matter how complex.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} viewport={{ once: true }} className="bg-[#0f1c38]/60 border border-accent/20 rounded-2xl p-8 relative transition-all duration-300 hover:border-accent/50 hover:shadow-[0_0_40px_rgba(59,130,246,0.1)]">
                        <div className="font-mono text-[1.8rem] text-accent/40 leading-[1] mb-4 font-bold">01</div>
                        <div className="w-11 h-11 bg-accent/10 border border-accent/30 rounded-xl flex items-center justify-center mb-6 text-[1.3rem]">🔗</div>
                        <div className="text-[1.15rem] text-[#e2e8f0] mb-3 font-semibold font-display">Paste a GitHub URL</div>
                        <div className="text-[0.95rem] text-[#8fa3bf] leading-[1.6]">Drop in any public GitHub repository URL. CogniCode fetches the full codebase in seconds.</div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} viewport={{ once: true }} className="bg-[#0f1c38]/60 border border-accent/20 rounded-2xl p-8 relative transition-all duration-300 hover:border-accent/50 hover:shadow-[0_0_40px_rgba(59,130,246,0.1)]">
                        <div className="font-mono text-[1.8rem] text-accent/40 leading-[1] mb-4 font-bold">02</div>
                        <div className="w-11 h-11 bg-accent/10 border border-accent/30 rounded-xl flex items-center justify-center mb-6 text-[1.3rem]">🧠</div>
                        <div className="text-[1.15rem] text-[#e2e8f0] mb-3 font-semibold font-display">AI Analyses the Repo</div>
                        <div className="text-[0.95rem] text-[#8fa3bf] leading-[1.6]">Our engine scans files, maps dependencies, identifies key modules, and builds a full concept graph.</div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} viewport={{ once: true }} className="bg-[#0f1c38]/60 border border-accent/20 rounded-2xl p-8 relative transition-all duration-300 hover:border-accent/50 hover:shadow-[0_0_40px_rgba(59,130,246,0.1)]">
                        <div className="font-mono text-[1.8rem] text-accent/40 leading-[1] mb-4 font-bold">03</div>
                        <div className="w-11 h-11 bg-accent/10 border border-accent/30 rounded-xl flex items-center justify-center mb-6 text-[1.3rem]">📖</div>
                        <div className="text-[1.15rem] text-[#e2e8f0] mb-3 font-semibold font-display">Get Your Learn Path</div>
                        <div className="text-[0.95rem] text-[#8fa3bf] leading-[1.6]">Receive a simplified breakdown and step-by-step learning path so you can understand and rebuild it yourself.</div>
                    </motion.div>
                </div>
            </section>

            {/* DIVIDER */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent max-w-[1400px]"></div>

            {/* FEATURES */}
            <section id="features" className="w-full max-w-[1400px] py-24 px-8 lg:px-16">
                <div className="font-mono text-[0.8rem] text-accent tracking-[3px] uppercase mb-4">// CAPABILITIES</div>
                <h2 className="text-[3rem] font-bold leading-[1.05] tracking-[-1px] text-[#f0f6ff] mb-4 font-display">Everything You Need</h2>
                <p className="text-[1.05rem] text-[#8fa3bf] max-w-[600px] leading-[1.65] mb-16 font-normal">Purpose-built tools to decode, understand, and master any repository.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-[#0a1428]/70 border border-accent/15 rounded-xl p-7 flex gap-5 transition-all duration-300 hover:border-accent/40 hover:bg-[#0f1c38]/80">
                        <div className="shrink-0 w-10 h-10 bg-accent/10 border border-accent/30 rounded-lg flex items-center justify-center text-[1.1rem]">⚡</div>
                        <div>
                            <div className="text-[1.05rem] text-[#e2e8f0] font-semibold mb-1.5 font-display">Instant Repo Cloning</div>
                            <div className="text-[0.9rem] text-[#8fa3bf] leading-[1.6]">CogniCode fetches and indexes any public GitHub repo in under 10 seconds, ready for deep analysis.</div>
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-[#0a1428]/70 border border-accent/15 rounded-xl p-7 flex gap-5 transition-all duration-300 hover:border-accent/40 hover:bg-[#0f1c38]/80">
                        <div className="shrink-0 w-10 h-10 bg-accent/10 border border-accent/30 rounded-lg flex items-center justify-center text-[1.1rem]">🗺️</div>
                        <div>
                            <div className="text-[1.05rem] text-[#e2e8f0] font-semibold mb-1.5 font-display">Concept Graph Mapping</div>
                            <div className="text-[0.9rem] text-[#8fa3bf] leading-[1.6]">Visualise how every module, function, and file connects — a full map of the codebase architecture.</div>
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-[#0a1428]/70 border border-accent/15 rounded-xl p-7 flex gap-5 transition-all duration-300 hover:border-accent/40 hover:bg-[#0f1c38]/80">
                        <div className="shrink-0 w-10 h-10 bg-accent/10 border border-accent/30 rounded-lg flex items-center justify-center text-[1.1rem]">🔍</div>
                        <div>
                            <div className="text-[1.05rem] text-[#e2e8f0] font-semibold mb-1.5 font-display">Dependency Analysis</div>
                            <div className="text-[0.9rem] text-[#8fa3bf] leading-[1.6]">Understand every dependency: what it does, why it's there, and how it interacts with the rest of the code.</div>
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="bg-[#0a1428]/70 border border-accent/15 rounded-xl p-7 flex gap-5 transition-all duration-300 hover:border-accent/40 hover:bg-[#0f1c38]/80">
                        <div className="shrink-0 w-10 h-10 bg-accent/10 border border-accent/30 rounded-lg flex items-center justify-center text-[1.1rem]">📚</div>
                        <div>
                            <div className="text-[1.05rem] text-[#e2e8f0] font-semibold mb-1.5 font-display">Step-by-Step Learn Mode</div>
                            <div className="text-[0.9rem] text-[#8fa3bf] leading-[1.6]">Follow a curated learning path that breaks down complex repos into digestible, ordered lessons.</div>
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="bg-[#0a1428]/70 border border-accent/15 rounded-xl p-7 flex gap-5 transition-all duration-300 hover:border-accent/40 hover:bg-[#0f1c38]/80">
                        <div className="shrink-0 w-10 h-10 bg-accent/10 border border-accent/30 rounded-lg flex items-center justify-center text-[1.1rem]">💬</div>
                        <div>
                            <div className="text-[1.05rem] text-[#e2e8f0] font-semibold mb-1.5 font-display">Ask Anything Mode</div>
                            <div className="text-[0.9rem] text-[#8fa3bf] leading-[1.6]">Chat directly with the codebase. Ask what a function does, how data flows, or how to rebuild a feature.</div>
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="bg-[#0a1428]/70 border border-accent/15 rounded-xl p-7 flex gap-5 transition-all duration-300 hover:border-accent/40 hover:bg-[#0f1c38]/80">
                        <div className="shrink-0 w-10 h-10 bg-accent/10 border border-accent/30 rounded-lg flex items-center justify-center text-[1.1rem]">🛡️</div>
                        <div>
                            <div className="text-[1.05rem] text-[#e2e8f0] font-semibold mb-1.5 font-display">Private & Secure</div>
                            <div className="text-[0.9rem] text-[#8fa3bf] leading-[1.6]">Your repos and queries are never stored. CogniCode processes everything ephemerally for full privacy.</div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* DIVIDER */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent max-w-[1400px]"></div>

            {/* CTA SECTION */}
            <section className="w-full max-w-[1400px] py-24 px-8 lg:px-16 text-center flex flex-col items-center">
                <div className="bg-gradient-to-br from-accent/5 to-[#0f1c38]/90 border border-accent/30 rounded-3xl p-16 w-full max-w-[860px] relative overflow-hidden">
                    <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-[radial-gradient(ellipse,rgba(59,130,246,0.12),transparent_70%)] pointer-events-none"></div>

                    <div className="font-mono text-[0.8rem] text-accent tracking-[3px] uppercase mb-4 text-center">// START DECODING</div>
                    <h2 className="text-[2.8rem] font-bold text-[#f0f6ff] mb-4 leading-[1.1] font-display">
                        Ready to Understand<br />
                        <span className="italic text-accent">Any Codebase?</span>
                    </h2>
                    <p className="text-[1.05rem] text-[#8fa3bf] mb-10 max-w-[500px] mx-auto leading-[1.6]">
                        Paste your first repo URL and CogniCode will handle the rest.
                    </p>

                    <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row items-center gap-3 bg-[#050f23]/80 border border-accent/30 rounded-xl p-3 max-w-[560px] mx-auto">
                        <input
                            type="text"
                            placeholder="https://github.com/user/repo"
                            className="flex-1 bg-transparent border-none outline-none font-mono text-[0.9rem] text-[#b0bfd4] caret-accent w-full px-2"
                            required
                        />
                        <button type="submit" className="w-full sm:w-auto bg-accent text-white border-none rounded-lg px-6 py-2.5 font-sans text-[0.9rem] font-semibold cursor-pointer whitespace-nowrap transition-all hover:bg-[#2563eb] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                            ANALYSE →
                        </button>
                    </form>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="w-full border-t border-accent/10 py-8 px-8 lg:px-16 flex flex-col md:flex-row items-center justify-between max-w-[1400px] gap-6">
                <div className="font-display text-[1rem] font-bold text-accent tracking-[1px]">COGNICODE</div>
                <ul className="flex flex-wrap justify-center gap-8 list-none m-0 p-0">
                    <li><a href="#how-it-works" className="font-sans text-[0.85rem] font-medium text-text-muted no-underline tracking-[0.3px] transition-colors hover:text-[#94a3b8]">HOW IT WORKS</a></li>
                    <li><a href="#features" className="font-sans text-[0.85rem] font-medium text-text-muted no-underline tracking-[0.3px] transition-colors hover:text-[#94a3b8]">FEATURES</a></li>
                </ul>
                <div className="font-sans text-[0.8rem] text-[#475569]">© 2026 COGNICODE. ALL RIGHTS RESERVED.</div>
            </footer>

        </div>
    );
}
