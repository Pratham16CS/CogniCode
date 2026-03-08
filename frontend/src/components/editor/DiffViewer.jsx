/**
 * DiffViewer — confidence-based diff view for bloat removal suggestions.
 */

import { FiCheck, FiAlertTriangle, FiInfo } from "react-icons/fi";

export default function DiffViewer({ confidence, removalLog }) {
    let items = [];
    try {
        items = typeof removalLog === "string" ? JSON.parse(removalLog) : removalLog || [];
    } catch {
        items = [];
    }

    const getConfidenceBadge = () => {
        if (confidence >= 95) {
            return (
                <span className="flex items-center gap-1.5 text-[0.65rem] font-mono tracking-widest px-2.5 py-1 rounded border bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30">
                    <FiCheck size={10} /> AUTO-SUGGESTED
                </span>
            );
        } else if (confidence >= 70) {
            return (
                <span className="flex items-center gap-1.5 text-[0.65rem] font-mono tracking-widest px-2.5 py-1 rounded border bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30">
                    <FiAlertTriangle size={10} /> REVIEW SUGGESTED
                </span>
            );
        } else {
            return (
                <span className="flex items-center gap-1.5 text-[0.65rem] font-mono tracking-widest px-2.5 py-1 rounded border bg-[#64748b]/10 text-[#8fa3bf] border-[#64748b]/30">
                    <FiInfo size={10} /> INFORMATIONAL
                </span>
            );
        }
    };

    // Always show the confidence score, even if the removal log is empty.

    return (
        <div className="flex items-center gap-4 px-2">
            <h4 className="text-[0.65rem] font-sans font-semibold text-[#8fa3bf] uppercase tracking-[2px] hidden sm:block">
                Confidence
            </h4>
            {getConfidenceBadge()}
            <div className="flex flex-col gap-1 w-[80px]">
                <div className="h-1.5 bg-[#050f23]/80 rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                    <div
                        className="h-full rounded-full transition-all duration-500 shadow-[0_0_8px_currentColor]"
                        style={{
                            width: `${confidence}%`,
                            background:
                                confidence >= 95
                                    ? "#10b981"
                                    : confidence >= 70
                                        ? "#f59e0b"
                                        : "#64748b",
                            color:
                                confidence >= 95
                                    ? "#10b981"
                                    : confidence >= 70
                                        ? "#f59e0b"
                                        : "#64748b",
                        }}
                    />
                </div>
                <p className="text-[0.6rem] font-mono tracking-widest text-[#64748b] text-right">{confidence}%</p>
            </div>
        </div>
    );
}
