import { FiTrash2, FiInfo, FiCode, FiScissors } from "react-icons/fi";

const getTypeIcon = (type) => {
    switch (type) {
        case "unused_import":
            return <FiCode className="text-[#f59e0b]" size={14} />;
        case "boilerplate":
            return <FiTrash2 className="text-[#ef4444]" size={14} />;
        case "redundant_code":
            return <FiScissors className="text-[#f97316]" size={14} />;
        default:
            return <FiInfo className="text-accent" size={14} />;
    }
};

export default function RemovalLog({ log }) {
    if (!log) {
        return <div className="p-4 text-xs text-text-muted">No removal log available.</div>;
    }

    let parsedLog = [];
    try {
        parsedLog = typeof log === "string" ? JSON.parse(log) : log;
    } catch (e) {
        return <div className="p-4 text-xs text-error">Failed to parse removal log.</div>;
    }

    if (!Array.isArray(parsedLog) || parsedLog.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                <FiCode size={24} className="mb-2 opacity-50" />
                <p className="text-sm">No boilderplate detected</p>
                <p className="text-xs">This file was already lean and logical.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="text-[0.8rem] font-mono tracking-widest uppercase text-accent-hover mb-6 bg-accent/10 p-3 rounded-lg border border-accent/20">
                The AI stripped {parsedLog.length} items of mechanical bloat to produce the Logic Skeleton.
            </div>
            {parsedLog.map((entry, idx) => (
                <div key={idx} className="bg-[#050f23]/60 border border-[#374766] rounded-xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.15)] hover:border-accent/40 transition-colors">
                    <div className="flex items-start gap-3 mb-2">
                        <div className="mt-0.5 bg-bg-secondary p-1.5 rounded-lg border border-border shrink-0">{getTypeIcon(entry.type)}</div>
                        <div className="flex-1">
                            <h4 className="text-[0.9rem] font-semibold text-[#f0f6ff] font-sans">{entry.item}</h4>
                            <p className="text-[0.8rem] text-[#8fa3bf] mt-1 leading-relaxed font-sans">{entry.reason}</p>
                        </div>
                        {entry.lines && (
                            <span className="text-[0.7rem] font-mono font-bold text-[#b0bfd4] bg-[#0a1428] border border-accent/30 px-2 py-1 rounded-md shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
                                L{entry.lines}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
