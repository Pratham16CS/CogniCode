/**
 * NotebookPanel — tabbed view: File Context, Removal Log, Skeleton Analysis, Q&A History, My Notes.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { FiSave, FiCheck, FiEdit3, FiMessageCircle, FiUser, FiCpu, FiRefreshCw } from "react-icons/fi";
import useAppStore from "../../store/appStore";
import { notebookAPI } from "../../api/client";
import client from "../../api/client";
import RemovalLog from "./RemovalLog";
import FileContext from "./FileContext";
import SkeletonExplainer from "./SkeletonExplainer";
import DiffViewer from "../editor/DiffViewer";

const tabs = [
    { id: "context", label: "File Context" },
    { id: "removal", label: "Removal Log" },
    { id: "skeleton", label: "Skeleton Analysis" },
    { id: "qna", label: "💬 Q&A History" },
    { id: "notes", label: "📝 My Notes" },
];

export default function NotebookPanel() {
    const [activeTab, setActiveTab] = useState("context");
    const selectedFile = useAppStore((s) => s.selectedFile);

    if (!selectedFile) {
        return (
            <div className="p-6 text-center text-sm text-text-muted">
                Select a file to view its learning notebook.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full border-t border-accent/20 bg-[#0a1428]/95 backdrop-blur-md">
            {/* Tab bar */}
            <div className="flex border-b border-accent/15 bg-gradient-to-r from-[#0f1c38]/60 to-transparent overflow-x-auto custom-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-3 text-[0.8rem] font-sans font-semibold tracking-[0.5px] whitespace-nowrap transition-all relative outline-none cursor-pointer ${activeTab === tab.id
                            ? "text-accent-hover bg-accent/5"
                            : "text-[#8fa3bf] hover:text-[#e2e8f0] hover:bg-[#0f1c38]/50"
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="notebook-tab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                            />
                        )}
                    </button>
                ))}
                <div className="ml-auto pr-3 flex items-center">
                    <DiffViewer
                        confidence={selectedFile.confidence_score}
                        removalLog={selectedFile.removal_log}
                    />
                </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === "context" && <FileContext fileContext={selectedFile.file_context} />}
                {activeTab === "removal" && <RemovalLog log={selectedFile.removal_log} />}
                {activeTab === "skeleton" && <SkeletonExplainer explanation={selectedFile.logical_core} />}
                {activeTab === "qna" && <QnAHistory fileId={selectedFile.id} />}
                {activeTab === "notes" && <UserNotes fileId={selectedFile.id} />}
            </div>
        </div>
    );
}


/**
 * QnAHistory — Displays saved chat Q&A pairs for this file in a clean format.
 */
function QnAHistory({ fileId }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const chatMessages = useAppStore((s) => s.chatMessages);

    // Fetch history from backend
    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const res = await client.get(`/notebooks/${fileId}/history`);
            const items = res.data?.history || [];
            setHistory(items);
        } catch (err) {
            console.error("Failed to load Q&A history:", err);
            setHistory([]);
        }
        setLoading(false);
    }, [fileId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Re-fetch when new chat messages arrive (so Q&A updates live)
    useEffect(() => {
        if (chatMessages.length > 0) {
            const timer = setTimeout(fetchHistory, 1000);
            return () => clearTimeout(timer);
        }
    }, [chatMessages.length, fetchHistory]);

    // Group into Q&A pairs
    const pairs = [];
    for (let i = 0; i < history.length; i++) {
        if (history[i].role === "user") {
            const answer = history[i + 1]?.role === "assistant" ? history[i + 1] : null;
            pairs.push({ question: history[i].content, answer: answer?.content || null });
            if (answer) i++; // skip the answer
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 text-text-muted text-xs">
                Loading Q&A history...
            </div>
        );
    }

    if (pairs.length === 0) {
        return (
            <div className="text-center py-8">
                <FiMessageCircle className="mx-auto text-text-muted mb-3" size={24} />
                <p className="text-sm text-text-secondary mb-1">No Q&A yet for this file</p>
                <p className="text-xs text-text-muted">Ask questions in the AI Tutor chat — they'll be saved here automatically.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between mb-4 border-b border-accent/15 pb-2">
                <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-accent-hover">
                    <FiMessageCircle size={14} className="text-accent" />
                    <span className="font-semibold">{pairs.length} Q&A pair{pairs.length !== 1 ? "s" : ""} saved</span>
                </div>
                <button
                    onClick={fetchHistory}
                    className="flex items-center gap-1 text-[10px] text-text-muted hover:text-accent transition-colors"
                >
                    <FiRefreshCw size={10} /> Refresh
                </button>
            </div>

            {pairs.map((pair, i) => (
                <div key={i} className="bg-[#050f23]/80 rounded-xl border border-accent/20 overflow-hidden shadow-[0_2px_15px_rgba(0,0,0,0.2)]">
                    {/* Question */}
                    <div className="flex items-start gap-3 px-4 py-3.5 border-b border-accent/15 bg-gradient-to-r from-[#0f1c38]/40 to-transparent">
                        <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                            <FiUser size={12} className="text-accent-hover" />
                        </div>
                        <div>
                            <span className="text-[0.7rem] uppercase font-mono tracking-widest text-accent-hover font-semibold block mb-1">Question</span>
                            <p className="text-[0.9rem] text-[#f0f6ff] leading-[1.6] font-sans">{pair.question}</p>
                        </div>
                    </div>
                    {/* Answer */}
                    {pair.answer && (
                        <div className="flex items-start gap-3 px-4 py-4 bg-[#0a1428]/60">
                            <div className="w-6 h-6 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center shrink-0">
                                <FiCpu size={12} className="text-[#10b981]" />
                            </div>
                            <div className="flex-1">
                                <span className="text-[0.7rem] uppercase font-mono tracking-widest text-[#10b981] font-semibold block mb-1">Answer</span>
                                <div className="prose prose-sm prose-invert prose-p:text-[#b0bfd4] prose-code:text-[#7dd3fc] leading-[1.7] whitespace-pre-wrap font-sans max-w-none">
                                    {pair.answer}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}


/**
 * UserNotes — editable textarea with auto-save for personal notes per file.
 */
function UserNotes({ fileId }) {
    const [notes, setNotes] = useState("");
    const [saveStatus, setSaveStatus] = useState("idle");
    const [loaded, setLoaded] = useState(false);
    const saveTimerRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        setLoaded(false);
        setSaveStatus("idle");

        notebookAPI.get(fileId).then((res) => {
            if (!cancelled) {
                setNotes(res.data?.user_notes || "");
                setLoaded(true);
            }
        }).catch(() => {
            if (!cancelled) {
                setNotes("");
                setLoaded(true);
            }
        });

        return () => { cancelled = true; };
    }, [fileId]);

    const saveNotes = useCallback(async (text) => {
        setSaveStatus("saving");
        try {
            await notebookAPI.updateNotes(fileId, text);
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (err) {
            console.error("Failed to save notes:", err);
            setSaveStatus("idle");
        }
    }, [fileId]);

    const handleChange = (e) => {
        const text = e.target.value;
        setNotes(text);
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => saveNotes(text), 1500);
    };

    if (!loaded) {
        return (
            <div className="flex items-center justify-center py-8 text-text-muted text-xs">
                Loading notes...
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="flex items-center justify-between border-b border-accent/15 pb-3">
                <div className="flex items-center gap-2 text-[0.85rem] font-display text-[#e2e8f0] tracking-wide">
                    <FiEdit3 size={14} className="text-accent" />
                    <span className="font-semibold">Your Personal Notes</span>
                </div>
                <div className="flex items-center gap-2 text-[0.7rem] font-mono tracking-widest uppercase">
                    {saveStatus === "saving" && (
                        <span className="text-amber-400 flex items-center gap-1">
                            <FiSave size={12} className="animate-pulse" /> Saving...
                        </span>
                    )}
                    {saveStatus === "saved" && (
                        <span className="text-[#10b981] flex items-center gap-1">
                            <FiCheck size={12} /> Saved
                        </span>
                    )}
                    {saveStatus === "idle" && notes.length > 0 && (
                        <span className="text-[#64748b]">Auto-saves on idle</span>
                    )}
                </div>
            </div>
            <textarea
                value={notes}
                onChange={handleChange}
                placeholder="Write your notes here...&#10;&#10;• Key takeaways from this file&#10;• Questions to research later&#10;• Your understanding of the logic&#10;• Anything you want to remember"
                className="flex-1 mt-3 min-h-[120px] w-full px-4 py-3 bg-[#050f23]/80 border border-accent/20 rounded-xl text-[0.9rem] text-[#f0f6ff] placeholder-[#475569] focus:outline-none focus:border-accent/60 focus:bg-[#050f23] focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all resize-none font-mono leading-[1.7]"
                spellCheck="false"
            />
            <div className="text-[0.7rem] font-mono tracking-widest uppercase text-[#64748b] text-right mt-2">
                {notes.length > 0 ? `${notes.split(/\s+/).filter(Boolean).length} WORDS` : "NO NOTES"}
            </div>
        </div>
    );
}
