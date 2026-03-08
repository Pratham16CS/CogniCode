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
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                    <FiCheck size={12} /> High Confidence — Auto-suggested
                </span>
            );
        } else if (confidence >= 70) {
            return (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
                    <FiAlertTriangle size={12} /> Medium Confidence — Review suggested
                </span>
            );
        } else {
            return (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-text-muted/10 text-text-muted border border-border">
                    <FiInfo size={12} /> Low Confidence — Informational
                </span>
            );
        }
    };

    // Always show the confidence score, even if the removal log is empty.

    return (
        <div className="p-3">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Confidence Score
                </h4>
                {getConfidenceBadge()}
            </div>
            <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden mb-1">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${confidence}%`,
                        background:
                            confidence >= 95
                                ? "#22c55e"
                                : confidence >= 70
                                    ? "#f59e0b"
                                    : "#64748b",
                    }}
                />
            </div>
            <p className="text-[10px] text-text-muted text-right mb-3">{confidence}%</p>
        </div>
    );
}
