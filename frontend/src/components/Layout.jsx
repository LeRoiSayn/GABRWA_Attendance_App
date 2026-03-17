import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import NotificationPanel from "./NotificationPanel";

const allNavItems = [
  {
    to: "/admin",
    label: "Tableau de bord",
    group: "Administration",
    roles: ["admin"],
  },
  {
    to: "/admin/reports",
    label: "Rapports",
    group: "Administration",
    roles: ["admin"],
  },
  {
    to: "/admin/users",
    label: "Utilisateurs",
    group: "Administration",
    roles: ["admin"],
  },
  {
    to: "/admin/visitors",
    label: "Visiteurs",
    group: "Administration",
    roles: ["admin"],
  },
  { to: "/gate", label: "Portail", group: "Opérations", access: "gate" },
  {
    to: "/reception",
    label: "Réception",
    group: "Opérations",
    access: "reception",
  },
];

const hasAccess = (user, item) => {
  if (item.roles) return item.roles.includes(user.role);
  if (item.access)
    return (
      user.role === "admin" ||
      user.role === item.access ||
      (user.permissions || []).includes(item.access)
    );
  return false;
};

const NAV_ICONS = {
  "/admin": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  ),
  "/admin/reports": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  ),
  "/admin/users": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  ),
  "/admin/visitors": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
    />
  ),
  "/gate": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
    />
  ),
  "/reception": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
    />
  ),
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const items = allNavItems.filter((item) => hasAccess(user, item));
  const groups = [...new Set(items.map((i) => i.group))];
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const initial = (user?.username || "?")[0].toUpperCase();

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-60 bg-slate-900
        transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0
      `}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-wide">
                GABRWA
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Gestion des Visiteurs
              </p>
            </div>
          </div>
        </div>

        {/* Utilisateur + cloche */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-blue-300">
                {initial}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.username}
              </p>
              <p className="text-[10px] text-slate-500 capitalize">
                {user?.role}
              </p>
            </div>

            {/* Bouton cloche */}
            <button
              onClick={() => setShowNotifPanel((v) => !v)}
              className="relative w-7 h-7 rounded-lg flex items-center justify-center
                         text-slate-400 hover:text-slate-200 hover:bg-white/[0.08]
                         transition-colors duration-150 shrink-0"
              title="Notifications"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1
                                 bg-red-500 text-white text-[10px] font-bold rounded-full
                                 flex items-center justify-center leading-none animate-pulse-once"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {groups.map((group) => (
            <div key={group}>
              <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                {group}
              </p>
              <div className="space-y-0.5">
                {items
                  .filter((i) => i.group === group)
                  .map((item) => {
                    const active = location.pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                        flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg
                        transition-colors duration-150
                        ${
                          active
                            ? "bg-blue-600 text-white font-medium shadow-sm"
                            : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                        }
                      `}
                      >
                        <svg
                          className="w-4 h-4 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {NAV_ICONS[item.to]}
                        </svg>
                        {item.label}
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        {/* Déconnexion */}
        <div className="px-3 py-3 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-500
                       rounded-lg hover:text-red-400 hover:bg-white/[0.06]
                       transition-colors duration-150"
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Overlay sidebar mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Contenu principal ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar mobile */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 md:hidden shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md hover:bg-slate-100 transition-colors duration-150"
          >
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="text-sm font-semibold text-slate-800 flex-1">
            GABRWA
          </span>
          {/* Cloche mobile */}
          <button
            onClick={() => setShowNotifPanel((v) => !v)}
            className="relative p-1.5 rounded-md hover:bg-slate-100 transition-colors duration-150"
          >
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 && (
              <span
                className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px]
                               font-bold rounded-full flex items-center justify-center"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </header>

        <main className="flex-1 overflow-auto p-5 md:p-8 animate-fadein">
          {children}
        </main>
      </div>

      {/* ── Panneau de notifications ─────────────────────────────────────── */}
      {showNotifPanel && (
        <NotificationPanel onClose={() => setShowNotifPanel(false)} />
      )}
    </div>
  );
}
