/**
 * Sidebar — file tree navigation.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiFolder, FiFile, FiChevronRight, FiChevronDown, FiSearch } from "react-icons/fi";
import useAppStore from "../../store/appStore";
import { fileAPI } from "../../api/client";

const langColors = {
    python: "#3572A5",
    javascript: "#f1e05a",
    typescript: "#3178c6",
    java: "#b07219",
    c: "#555555",
    cpp: "#f34b7d",
    html: "#e34c26",
    css: "#563d7c",
    go: "#00ADD8",
    rust: "#dea584",
};

function TreeNode({ node, depth = 0 }) {
    const [expanded, setExpanded] = useState(depth < 2);
    const { selectedFile, setSelectedFile, setEditorContent, setChatMessages } = useAppStore();

    const isDir = node.type === "directory";

    const handleClick = async () => {
        if (isDir) {
            setExpanded(!expanded);
        } else if (node.file_id) {
            try {
                const res = await fileAPI.detail(node.file_id);
                setSelectedFile(res.data);
                setEditorContent(res.data.original_content || "", res.data.skeleton_content || "");
                setChatMessages([]); // Clear chat history when switching files
            } catch (e) {
                console.error("Failed to load file:", e);
            }
        }
    };

    return (
        <div>
            <button
                onClick={handleClick}
                className={`w-full flex items-center gap-2 py-1.5 px-2 text-left text-[0.85rem] font-sans transition-colors group cursor-pointer border-l-2 outline-none
                    ${node.file_id === selectedFile?.id
                        ? "bg-[#0f1c38]/80 border-accent text-[#f0f6ff] shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]"
                        : "border-transparent hover:bg-[#0f1c38]/50 text-[#b0bfd4] hover:text-[#e2e8f0]"
                    }
                `}
                style={{ paddingLeft: `${depth * 14 + 12}px` }}
            >
                {isDir ? (
                    <>
                        {expanded ? (
                            <FiChevronDown size={14} className="text-[#64748b] shrink-0" />
                        ) : (
                            <FiChevronRight size={14} className="text-[#64748b] shrink-0" />
                        )}
                        <FiFolder size={15} className="text-accent shrink-0" />
                    </>
                ) : (
                    <>
                        <span className="w-3.5 shrink-0" />
                        <FiFile size={14} className="shrink-0" style={{ color: langColors[node.language] || "#8fa3bf" }} />
                    </>
                )}
                <span className="truncate">
                    {node.name}
                </span>
            </button>

            <AnimatePresence>
                {isDir && expanded && node.children && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        {node.children.map((child, i) => (
                            <TreeNode key={child.path || i} node={child} depth={depth + 1} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function Sidebar() {
    const fileTree = useAppStore((s) => s.fileTree);
    const [filter, setFilter] = useState("");

    const filteredTree = filter
        ? fileTree.filter((n) =>
            JSON.stringify(n).toLowerCase().includes(filter.toLowerCase())
        )
        : fileTree;

    return (
        <aside className="w-64 min-w-[220px] bg-[#0a1428]/95 backdrop-blur-md border-r border-accent/20 flex flex-col shrink-0 overflow-hidden shadow-[2px_0_15px_rgba(0,0,0,0.2)] z-40">
            <div className="p-3 border-b border-accent/15 bg-gradient-to-b from-[#0f1c38]/40 to-transparent">
                <div className="relative font-sans">
                    <FiSearch className="absolute left-3 top-2.5 text-[#64748b]" size={14} />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#050f23]/80 border border-accent/20 rounded shadow-[inset_0_1px_4px_rgba(0,0,0,0.4)] text-[0.8rem] text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-accent/80 focus:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                {filteredTree.length > 0 ? (
                    filteredTree.map((node, i) => <TreeNode key={node.path || i} node={node} />)
                ) : (
                    <p className="text-xs text-text-muted text-center mt-8 px-4">
                        {fileTree.length === 0 ? "No files analyzed yet" : "No matches"}
                    </p>
                )}
            </div>
        </aside>
    );
}
