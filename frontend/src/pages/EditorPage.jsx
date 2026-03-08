/**
 * EditorPage — Main workspace view with dual editors, notebook panel, and chat.
 * Shows Project Overview when no file is selected.
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useAppStore from "../store/appStore";
import { useRepository } from "../hooks/useRepository";
import AppShell from "../components/layout/AppShell";
import DualEditor from "../components/editor/DualEditor";
import NotebookPanel from "../components/notebook/NotebookPanel";
import ChatSidebar from "../components/chat/ChatSidebar";
import ProjectOverview from "../components/dashboard/ProjectOverview";

export default function EditorPage() {
    const { repoId } = useParams();
    const { loadRepo } = useRepository();
    const { activeRepo, selectedFile } = useAppStore();
    const [showOverview, setShowOverview] = useState(true);

    useEffect(() => {
        if (repoId) {
            loadRepo(parseInt(repoId));
        }
    }, [repoId, loadRepo]);

    // Show overview when no file is selected
    useEffect(() => {
        setShowOverview(!selectedFile);
    }, [selectedFile]);

    return (
        <AppShell chatPanel={<ChatSidebar repoId={parseInt(repoId)} />}>
            {showOverview ? (
                <ProjectOverview repo={activeRepo} />
            ) : (
                <div className="flex flex-col h-full">
                    {/* Top: Dual Editors (60% height) */}
                    <div className="flex-[3] overflow-hidden">
                        <DualEditor />
                    </div>

                    {/* Bottom: Notebook Panel (40% height) */}
                    <div className="flex-[2] overflow-hidden">
                        <NotebookPanel />
                    </div>
                </div>
            )}
        </AppShell>
    );
}
