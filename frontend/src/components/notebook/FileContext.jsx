/**
 * FileContext — shows the file's role within the project architecture.
 */

import ReactMarkdown from "react-markdown";
import { FiMapPin } from "react-icons/fi";

export default function FileContext({ fileContext }) {
    if (!fileContext) {
        return (
            <p className="text-sm text-text-muted">
                File context will be available after analysis completes.
            </p>
        );
    }

    return (
        <div className="bg-[#050f23]/50 rounded-2xl border border-accent/20 p-6 shadow-[0_2px_15px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-2 mb-4 border-b border-accent/15 pb-2">
                <FiMapPin size={16} className="text-accent" />
                <h4 className="text-[0.8rem] font-sans font-semibold text-[#e2e8f0] uppercase tracking-widest">
                    Role in Project
                </h4>
            </div>
            <div className="prose prose-invert prose-sm max-w-none 
                prose-p:leading-[1.7] prose-p:text-[#b0bfd4] 
                prose-code:text-accent-hover prose-code:bg-black/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-black/50 prose-pre:border prose-pre:border-accent/15 prose-pre:rounded-xl prose-pre:my-3 prose-pre:p-4
                prose-strong:text-white prose-strong:font-bold
            ">
                <ReactMarkdown>{fileContext}</ReactMarkdown>
            </div>
        </div>
    );
}
