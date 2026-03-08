/**
 * AppShell — three-pane layout (Sidebar | Main Content | Chat Panel).
 */

import Header from "./Header";
import Sidebar from "./Sidebar";

export default function AppShell({ children, chatPanel }) {
    return (
        <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
                {chatPanel && (
                    <aside className="w-80 min-w-[280px] border-l border-border bg-bg-secondary flex flex-col overflow-hidden shrink-0">
                        {chatPanel}
                    </aside>
                )}
            </div>
        </div>
    );
}
