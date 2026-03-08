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
        <div className="flex flex-col h-full border-t border-border bg-bg-secondary">
            {/* Tab bar */}
            <div className="flex border-b border-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-xs font-medium transition-colors relative ${activeTab === tab.id
                            ? "text-accent"
                            : "text-text-muted hover:text-text-secondary"
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
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <FiMessageCircle size={12} className="text-accent" />
                    <span className="font-medium">{pairs.length} Q&A pair{pairs.length !== 1 ? "s" : ""} saved</span>
                </div>
                <button
                    onClick={fetchHistory}
                    className="flex items-center gap-1 text-[10px] text-text-muted hover:text-accent transition-colors"
                >
                    <FiRefreshCw size={10} /> Refresh
                </button>
            </div>

            {pairs.map((pair, i) => (
                <div key={i} className="bg-bg-primary rounded-lg border border-border overflow-hidden">
                    {/* Question */}
                    <div className="flex items-start gap-2 px-3 py-2.5 border-b border-border/50">
                        <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                            <FiUser size={10} className="text-accent" />
                        </div>
                        <div>
                            <span className="text-[10px] text-accent font-medium block mb-0.5">Question</span>
                            <p className="text-xs text-text-primary leading-relaxed">{pair.question}</p>
                        </div>
                    </div>
                    {/* Answer */}
                    {pair.answer && (
                        <div className="flex items-start gap-2 px-3 py-2.5 bg-bg-secondary/50">
                            <div className="w-5 h-5 rounded-full bg-skeleton/20 flex items-center justify-center shrink-0 mt-0.5">
                                <FiCpu size={10} className="text-skeleton" />
                            </div>
                            <div>
                                <span className="text-[10px] text-skeleton font-medium block mb-0.5">Answer</span>
                                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">{pair.answer}</p>
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <FiEdit3 size={12} className="text-accent" />
                    <span className="font-medium">Your personal notes for this file</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                    {saveStatus === "saving" && (
                        <span className="text-amber-400 flex items-center gap-1">
                            <FiSave size={10} className="animate-pulse" /> Saving...
                        </span>
                    )}
                    {saveStatus === "saved" && (
                        <span className="text-green-400 flex items-center gap-1">
                            <FiCheck size={10} /> Saved
                        </span>
                    )}
                    {saveStatus === "idle" && notes.length > 0 && (
                        <span className="text-text-muted">Auto-saves as you type</span>
                    )}
                </div>
            </div>
            <textarea
                value={notes}
                onChange={handleChange}
                placeholder="Write your notes here...&#10;&#10;• Key takeaways from this file&#10;• Questions to research later&#10;• Your understanding of the logic&#10;• Anything you want to remember"
                className="flex-1 min-h-[120px] w-full px-3 py-2.5 bg-bg-primary border border-border rounded-lg text-xs text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all resize-none font-mono leading-relaxed"
                spellCheck="false"
            />
            <div className="text-[10px] text-text-muted text-right">
                {notes.length > 0 ? `${notes.split(/\s+/).filter(Boolean).length} words` : "No notes yet"}
            </div>
        </div>
    );
}
