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
                <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/30 text-accent flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_8px_rgba(59,130,246,0.15)]">
                    <FiCpu size={14} />
                </div>
            )}
            <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-[0.85rem] leading-[1.6] shadow-[0_2px_10px_rgba(0,0,0,0.1)] font-sans ${isUser
                    ? "bg-[#0f1c38]/80 text-[#f0f6ff] border border-accent/20"
                    : "bg-[#050f23]/60 text-[#b0bfd4] border border-[#374766]"
                    }`}
            >
                {message.cached && (
                    <span className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-widest text-[#10b981] mb-2 font-mono font-semibold">
                        <FiZap size={12} /> Cached Answer
                    </span>
                )}
                <div className="prose prose-invert prose-sm max-w-none [&_p]:m-0 [&_pre]:bg-[#0a1428] [&_pre]:p-3 [&_pre]:border [&_pre]:border-accent/15 [&_pre]:rounded-lg [&_pre]:text-[0.75rem] [&_code]:text-[#7dd3fc] [&_code]:text-[0.8rem] [&_code]:font-mono">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
            </div>
            {isUser && (
                <div className="w-7 h-7 rounded-full bg-[#0a1428]/80 border border-accent/20 text-[#8fa3bf] flex items-center justify-center shrink-0 mt-0.5 shadow-[0_2px_5px_rgba(0,0,0,0.2)]">
                    <FiUser size={14} />
                </div>
            )}
        </div>
    );
}
