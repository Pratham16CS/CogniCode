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
                <div className="w-6 h-6 rounded-md bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <FiCpu size={12} />
                </div>
            )}
            <div
                className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${isUser
                        ? "bg-accent/15 text-text-primary border border-accent/20"
                        : "bg-bg-tertiary text-text-secondary border border-border"
                    }`}
            >
                {message.cached && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-skeleton mb-1 font-medium">
                        <FiZap size={10} /> Cached Answer
                    </span>
                )}
                <div className="prose prose-invert prose-xs max-w-none [&_p]:m-0 [&_pre]:bg-bg-primary [&_pre]:p-2 [&_pre]:rounded [&_pre]:text-[11px] [&_code]:text-accent [&_code]:text-[11px]">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
            </div>
            {isUser && (
                <div className="w-6 h-6 rounded-md bg-bg-tertiary text-text-muted flex items-center justify-center shrink-0 mt-0.5">
                    <FiUser size={12} />
                </div>
            )}
        </div>
    );
}
