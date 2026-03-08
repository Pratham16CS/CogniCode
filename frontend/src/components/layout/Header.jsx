/**
 * Header — top navigation bar with full navigation links.
 */

import { FiCode, FiHome, FiLogOut, FiBook, FiShield, FiGitBranch } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import useAppStore from "../../store/appStore";

export default function Header() {
    const { user, logout } = useAuth();
    const activeRepo = useAppStore((s) => s.activeRepo);
    const location = useLocation();

    const isEditor = location.pathname.startsWith("/editor");

    return (
        <header className="h-14 flex items-center justify-between px-6 bg-[#0a1428]/95 backdrop-blur-md border-b border-accent/20 shrink-0 shadow-sm z-50">
            <div className="flex items-center gap-4">
                <Link to="/home" className="flex items-center gap-3 hover:opacity-90 transition-all no-underline">
                    <img src="/logo.png" alt="CogniCode" className="w-8 h-8 rounded-lg shadow-[0_0_12px_rgba(59,130,246,0.4)] border border-accent/20" />
                    <span className="text-[1.1rem] font-bold text-white font-display tracking-[1.5px] bg-clip-text text-transparent bg-gradient-to-r from-accent-hover to-[#10b981]">COGNICODE</span>
                </Link>
                {activeRepo && (
                    <>
                        <span className="text-accent/30 text-sm">/</span>
                        <span className="text-xs font-mono text-[#b0bfd4] px-2.5 py-1 bg-accent/10 border border-accent/20 rounded shadow-[inset_0_1px_4px_rgba(0,0,0,0.2)] flex items-center gap-1.5">
                            <FiGitBranch size={11} className="text-accent/80" />
                            {activeRepo.repo_name}
                        </span>
                    </>
                )}
            </div>

            {/* Center: Navigation Links */}
            <nav className="flex items-center gap-1">
                <NavLink to="/home" icon={<FiHome size={13} />} label="Dashboard" active={location.pathname === "/home"} />
                {activeRepo && (
                    <NavLink
                        to={`/editor/${activeRepo.id}`}
                        icon={<FiCode size={13} />}
                        label="Editor"
                        active={isEditor}
                    />
                )}
            </nav>

            {/* Right: User + Logout */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-md">
                    <FiShield size={11} className="text-[#10b981]" />
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#10b981]">Sentinel</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent-hover font-bold text-sm shadow-[inset_0_0_8px_rgba(59,130,246,0.2)]">
                        {user?.username?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="text-xs font-sans text-[#e2e8f0] font-medium hidden sm:block">{user?.username}</span>
                </div>
                <button
                    onClick={logout}
                    className="text-[#8fa3bf] hover:text-[#ef4444] transition-all p-2 rounded-lg hover:bg-[#ef4444]/15 cursor-pointer border border-transparent hover:border-[#ef4444]/30"
                    title="Sign Out"
                >
                    <FiLogOut size={16} />
                </button>
            </div>
        </header>
    );
}

function NavLink({ to, icon, label, active }) {
    return (
        <Link
            to={to}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-sans font-medium transition-all no-underline ${active
                ? "bg-accent/15 text-accent-hover border border-accent/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                : "text-[#8fa3bf] border border-transparent hover:text-[#f0f6ff] hover:bg-[#0f1c38]/60"
                }`}
        >
            {icon}
            {label}
        </Link>
    );
}
