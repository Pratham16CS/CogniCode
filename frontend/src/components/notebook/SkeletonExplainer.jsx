/**
 * SkeletonExplainer — explains the algorithms and logic in the skeleton code.
 */

import ReactMarkdown from "react-markdown";
import { FiCpu } from "react-icons/fi";

export default function SkeletonExplainer({ explanation }) {
    if (!explanation) {
        return (
            <p className="text-sm text-text-muted">
                Skeleton analysis will be available after processing.
            </p>
        );
    }

    return (
        <div className="bg-[#050f23]/50 rounded-2xl border border-[#10b981]/20 p-6 shadow-[0_2px_15px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-2 mb-4 border-b border-[#10b981]/15 pb-2">
                <FiCpu size={16} className="text-[#10b981]" />
                <h4 className="text-[0.8rem] font-sans font-semibold text-[#e2e8f0] uppercase tracking-widest">
                    Logical Core Analysis
                </h4>
            </div>
            <div className="prose prose-invert prose-sm max-w-none 
                prose-p:leading-[1.7] prose-p:text-[#b0bfd4] 
                prose-code:text-accent-hover prose-code:bg-black/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-black/50 prose-pre:border prose-pre:border-accent/15 prose-pre:rounded-xl prose-pre:my-3 prose-pre:p-4
                prose-strong:text-white prose-strong:font-bold
                prose-headings:text-white prose-headings:font-bold prose-headings:mb-2
            ">
                <ReactMarkdown>{explanation}</ReactMarkdown>
            </div>
        </div>
    );
}
