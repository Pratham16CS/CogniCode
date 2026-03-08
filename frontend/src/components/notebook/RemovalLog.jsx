import { FiTrash2, FiInfo, FiCode, FiScissors } from "react-icons/fi";

const getTypeIcon = (type) => {
    switch (type) {
        case "unused_import":
            return <FiCode className="text-amber-400" />;
        case "boilerplate":
            return <FiTrash2 className="text-red-400" />;
        case "redundant_code":
            return <FiScissors className="text-orange-400" />;
        default:
            return <FiInfo className="text-blue-400" />;
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
        <div className="space-y-3">
            <div className="text-xs text-text-muted mb-4">
                The AI stripped {parsedLog.length} items of mechanical bloat to produce the Logic Skeleton.
            </div>
            {parsedLog.map((entry, idx) => (
                <div key={idx} className="bg-bg-primary border border-border rounded-md p-3">
                    <div className="flex items-start gap-2 mb-2">
                        <div className="mt-0.5">{getTypeIcon(entry.type)}</div>
                        <div className="flex-1">
                            <h4 className="text-xs font-semibold text-text-primary">{entry.item}</h4>
                            <p className="text-[10px] text-text-muted mt-0.5">{entry.reason}</p>
                        </div>
                        {entry.lines && (
                            <span className="text-[10px] font-mono text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">
                                L{entry.lines}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
