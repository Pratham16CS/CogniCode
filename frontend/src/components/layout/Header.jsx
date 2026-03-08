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
            {/* Left: Branding + Repo */}
            <div className="flex items-center gap-4">
                <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity no-underline">
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#3b82f6] to-[#10b981] flex items-center justify-center shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                        <FiCode size={14} className="text-white" />
                    </div>
                    <span className="text-[1.05rem] font-bold text-accent-hover font-display tracking-[1px]">COGNICODE</span>
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
                <span className="text-xs font-sans text-[#b0bfd4] font-medium">{user?.username}</span>
                <button
                    onClick={logout}
                    className="text-[#8fa3bf] hover:text-[#ef4444] transition-colors p-1.5 rounded hover:bg-[#ef4444]/10 cursor-pointer"
                    title="Sign Out"
                >
                    <FiLogOut size={15} />
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
