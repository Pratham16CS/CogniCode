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
        <header className="h-12 flex items-center justify-between px-4 bg-bg-secondary border-b border-border shrink-0">
            {/* Left: Branding + Repo */}
            <div className="flex items-center gap-3">
                <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent to-skeleton flex items-center justify-center">
                        <FiCode size={13} className="text-white" />
                    </div>
                    <span className="text-sm font-bold text-text-primary">CogniCode</span>
                </Link>
                {activeRepo && (
                    <>
                        <span className="text-text-muted text-xs">/</span>
                        <span className="text-xs text-text-muted px-2 py-0.5 bg-bg-tertiary rounded flex items-center gap-1">
                            <FiGitBranch size={10} />
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
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-bg-tertiary rounded-md">
                    <FiShield size={10} className="text-green-400" />
                    <span className="text-[10px] text-text-muted">Sentinel</span>
                </div>
                <span className="text-xs text-text-secondary font-medium">{user?.username}</span>
                <button
                    onClick={logout}
                    className="text-text-muted hover:text-error transition-colors p-1 rounded hover:bg-bg-tertiary"
                    title="Sign Out"
                >
                    <FiLogOut size={14} />
                </button>
            </div>
        </header>
    );
}

function NavLink({ to, icon, label, active }) {
    return (
        <Link
            to={to}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${active
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "text-text-muted hover:text-text-secondary hover:bg-bg-tertiary"
                }`}
        >
            {icon}
            {label}
        </Link>
    );
}
