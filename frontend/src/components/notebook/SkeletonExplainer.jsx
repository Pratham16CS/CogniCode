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
            <div className="prose prose-invert prose-sm max-w-none text-[#b0bfd4] leading-[1.7] font-sans prose-p:mb-3 prose-strong:text-[#f0f6ff] prose-code:text-[#10b981] prose-code:text-[0.8rem] prose-ul:pl-5 prose-h3:text-[#e2e8f0] prose-h3:text-[1rem] prose-h3:mt-5 prose-h3:mb-3 prose-h3:font-display">
                <ReactMarkdown>{explanation}</ReactMarkdown>
            </div>
        </div>
    );
}
