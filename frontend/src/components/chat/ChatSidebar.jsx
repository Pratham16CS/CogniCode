/**
 * ChatSidebar — real-time AI chat + edit approval with security layers.
 *
 * Handles:
 * - chat_reply: normal AI responses
 * - edit_proposal: Sentinel-approved edit awaiting user confirmation (Layer 5)
 * - sentinel_blocked: edit rejected by the security sentinel (Layer 3)
 * - edit_applied: user-approved edit confirmed by server
 * - edit_rejected: user-rejected edit confirmed by server
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiSend, FiLoader, FiCpu, FiShield, FiCheck, FiX, FiAlertTriangle,
} from "react-icons/fi";
import useAppStore from "../../store/appStore";
import { useWebSocket } from "../../hooks/useWebSocket";
import ChatMessage from "./ChatMessage";

export default function ChatSidebar({ repoId }) {
    const [input, setInput] = useState("");
    const [pendingEdit, setPendingEdit] = useState(null); // {edit_id, old_code, new_code, ...}
    const {
        selectedFile, chatMessages, addChatMessage,
        isChatLoading, setChatLoading,
    } = useAppStore();
    const { on, send } = useWebSocket(repoId);
    const messagesEndRef = useRef(null);

    // ─── WebSocket Listeners ───────────────────────
    useEffect(() => {
        const unsubReply = on("chat_reply", (data) => {
            addChatMessage({
                role: "assistant",
                content: data.content,
                cached: data.cached,
                timestamp: new Date().toISOString(),
            });
            setChatLoading(false);
        });

        // Layer 5: Edit PROPOSAL (not yet applied)
        const unsubProposal = on("edit_proposal", (data) => {
            setPendingEdit(data);
            addChatMessage({
                role: "assistant",
                content: `🔒 **Edit Proposal** for \`${data.file_path}\`\n\nSentinel: ${data.sentinel_verdict === "safe" ? "✅ SAFE" : "⚠️ " + data.sentinel_verdict}\n\nReview the diff below and **Approve** or **Reject**.`,
                timestamp: new Date().toISOString(),
            });
            setChatLoading(false);
        });

        // Layer 3: Sentinel BLOCKED the edit
        const unsubBlocked = on("sentinel_blocked", (data) => {
            addChatMessage({
                role: "assistant",
                content: `🛡️ **Sentinel Blocked** — the generated edit was rejected by the security layer.\n\n**Reason:** ${data.reason}\n\nThe edit was **not applied**. Try rephrasing your instruction.`,
                timestamp: new Date().toISOString(),
            });
            setChatLoading(false);
        });

        // Edit approved and applied by server
        const unsubApplied = on("edit_applied", (data) => {
            setPendingEdit(null);
            // Apply to Monaco editor
            const editorRef = window.__cognicode_skeleton_editor;
            if (editorRef?.current && data.full_replace) {
                editorRef.current.setValue(data.text);
                useAppStore.getState().updateSkeletonContent(data.text);
            }
            addChatMessage({
                role: "assistant",
                content: `✅ Edit approved and applied to \`${data.path}\`. Check the editor.`,
                timestamp: new Date().toISOString(),
            });
        });

        const unsubRejected = on("edit_rejected", (data) => {
            setPendingEdit(null);
            addChatMessage({
                role: "assistant",
                content: "❌ Edit rejected. No changes were made.",
                timestamp: new Date().toISOString(),
            });
        });

        const unsubError = on("error", (data) => {
            addChatMessage({
                role: "assistant",
                content: `⚠️ Error: ${data.message}`,
                timestamp: new Date().toISOString(),
            });
            setChatLoading(false);
        });

        return () => {
            unsubReply();
            unsubProposal();
            unsubBlocked();
            unsubApplied();
            unsubRejected();
            unsubError();
        };
    }, [on, addChatMessage, setChatLoading]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, pendingEdit]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || !selectedFile || isChatLoading) return;

        const message = input.trim();
        setInput("");

        addChatMessage({
            role: "user",
            content: message,
            timestamp: new Date().toISOString(),
        });

        setChatLoading(true);

        const isEdit = message.toLowerCase().startsWith("/edit ");
        if (isEdit) {
            send({
                type: "edit_request",
                file_id: selectedFile.id,
                instruction: message.slice(6),
            });
        } else {
            send({
                type: "chat",
                file_id: selectedFile.id,
                message,
            });
        }
    };

    const handleApprove = () => {
        if (!pendingEdit) return;
        send({ type: "edit_approve", edit_id: pendingEdit.edit_id });
    };

    const handleReject = () => {
        if (!pendingEdit) return;
        send({ type: "edit_reject", edit_id: pendingEdit.edit_id });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
                <FiCpu size={14} className="text-accent" />
                <span className="text-xs font-semibold text-text-primary">AI Tutor</span>
                <FiShield size={11} className="text-green-400 ml-1" title="Security layers active" />
                {selectedFile && (
                    <span className="text-[10px] text-text-muted ml-auto truncate max-w-[120px]">
                        {selectedFile.file_path?.split("/").pop()}
                    </span>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                {chatMessages.length === 0 && (
                    <div className="text-center py-8">
                        <FiCpu className="mx-auto text-text-muted mb-3" size={28} />
                        <p className="text-sm text-text-secondary mb-1">Ask me anything about this file</p>
                        <p className="text-xs text-text-muted">
                            Type <code className="px-1 py-0.5 bg-bg-primary rounded text-accent">/edit</code> to modify skeleton
                        </p>
                        <p className="text-[10px] text-text-muted mt-2 flex items-center justify-center gap-1">
                            <FiShield size={10} className="text-green-400" />
                            Edits reviewed by Sentinel before you see them
                        </p>
                    </div>
                )}

                {chatMessages.map((msg, i) => (
                    <ChatMessage key={i} message={msg} />
                ))}

                {/* Pending Edit: Diff + Approve/Reject */}
                <AnimatePresence>
                    {pendingEdit && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-bg-card border border-amber-500/30 rounded-lg p-3 space-y-2"
                        >
                            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                                <FiAlertTriangle size={12} />
                                Pending Edit — Review Required
                            </div>
                            {/* Mini diff preview */}
                            <div className="max-h-40 overflow-y-auto rounded bg-bg-primary p-2">
                                <pre className="text-[10px] text-red-400 line-through overflow-hidden">
                                    {pendingEdit.old_code?.slice(0, 300)}...
                                </pre>
                                <pre className="text-[10px] text-green-400 mt-1 overflow-hidden">
                                    {pendingEdit.new_code?.slice(0, 300)}...
                                </pre>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleApprove}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded-md transition-colors"
                                >
                                    <FiCheck size={12} /> Approve
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs rounded-md transition-colors"
                                >
                                    <FiX size={12} /> Reject
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isChatLoading && (
                    <div className="flex items-center gap-2 text-xs text-text-muted py-2">
                        <FiLoader className="animate-spin" size={12} />
                        Thinking...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-2 border-t border-border">
                <div className="flex gap-2">
                    <input
                        id="chat-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={selectedFile ? "Ask about this file..." : "Select a file first"}
                        disabled={!selectedFile || isChatLoading}
                        className="flex-1 px-3 py-2 bg-bg-primary border border-border rounded-lg text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || !selectedFile || isChatLoading}
                        className="px-3 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors disabled:opacity-30"
                    >
                        <FiSend size={13} />
                    </button>
                </div>
            </form>
        </div>
    );
}
