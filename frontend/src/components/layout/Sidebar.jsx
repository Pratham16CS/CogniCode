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
    const { setSelectedFile, setEditorContent, setChatMessages } = useAppStore();

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
                className="w-full flex items-center gap-1.5 py-1 px-2 text-left text-sm hover:bg-bg-hover rounded transition-colors group"
                style={{ paddingLeft: `${depth * 14 + 8}px` }}
            >
                {isDir ? (
                    <>
                        {expanded ? (
                            <FiChevronDown size={12} className="text-text-muted shrink-0" />
                        ) : (
                            <FiChevronRight size={12} className="text-text-muted shrink-0" />
                        )}
                        <FiFolder size={14} className="text-accent shrink-0" />
                    </>
                ) : (
                    <>
                        <span className="w-3 shrink-0" />
                        <FiFile size={13} className="shrink-0" style={{ color: langColors[node.language] || "#64748b" }} />
                    </>
                )}
                <span className="truncate text-text-secondary group-hover:text-text-primary transition-colors">
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
        <aside className="w-60 min-w-[200px] bg-bg-secondary border-r border-border flex flex-col shrink-0 overflow-hidden">
            <div className="p-2 border-b border-border">
                <div className="relative">
                    <FiSearch className="absolute left-2.5 top-2 text-text-muted" size={13} />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-bg-primary border border-border rounded text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
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
