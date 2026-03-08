/**
 * ChatMessage — single chat message bubble.
 */

import { FiUser, FiCpu, FiZap } from "react-icons/fi";
import ReactMarkdown from "react-markdown";

export default function ChatMessage({ message }) {
    const isUser = message.role === "user";

    return (
        <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-accent/30 shadow-[0_0_10px_rgba(59,130,246,0.2)] mt-0.5 shrink-0">
                    <img src="/logo.png" alt="AI" className="w-full h-full object-cover" />
                </div>
            )}
            <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-[0.9rem] leading-[1.65] shadow-[0_4px_15px_rgba(0,0,0,0.15)] font-sans transition-all ${isUser
                    ? "bg-[#0f1c38]/90 text-[#f0f6ff] border border-accent/20 rounded-tr-none"
                    : "bg-[#050f23]/80 text-[#e2e8f0] border border-white/5 rounded-tl-none backdrop-blur-sm"
                    }`}
            >
                {message.cached && (
                    <span className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-widest text-[#10b981] mb-2 font-mono font-semibold">
                        <FiZap size={12} /> Cached Answer
                    </span>
                )}
                <div className="prose prose-invert prose-sm max-w-none 
                    prose-p:leading-[1.7] prose-p:text-[#b0bfd4] 
                    prose-code:text-accent-hover prose-code:bg-black/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-black/50 prose-pre:border prose-pre:border-accent/15 prose-pre:rounded-xl prose-pre:my-3 prose-pre:p-4
                    prose-strong:text-white prose-strong:font-bold
                    prose-headings:text-white prose-headings:font-bold prose-headings:mb-2
                    [&_ul]:my-2 [&_li]:my-1
                ">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
            </div>
            {isUser && (
                <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 text-accent-hover flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(59,130,246,0.2)] font-bold text-xs uppercase">
                    U
                </div>
            )}
        </div>
    );
}
