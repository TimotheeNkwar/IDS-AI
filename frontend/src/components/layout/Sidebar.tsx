import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  PanelLeftClose,
  PanelLeftOpen,
  BarChart2,
  Network,
  ShieldAlert,
  Lightbulb,
  HelpCircle,
  LogOut,
  Settings,
  Cpu,
  Sun,
  Moon,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore.ts";
import { useThemeStore } from "../../stores/themeStore.ts";

const navItemsGeneral = [
  {
    name: "Traffic Monitor",
    icon: <Network size={16} />,
    path: "/traffic-monitor",
  },
  {
    name: "Network Stats",
    icon: <BarChart2 size={16} />,
    path: "/network-stats",
  },
  {
    name: "Threats Analysis",
    icon: <ShieldAlert size={16} />,
    path: "/threats-analysis",
  },
];

const navItemsSuggestions = [
  {
    name: "Suggested Actions",
    icon: <Lightbulb size={16} />,
    path: "/suggested-actions",
  },
];

const navItemsSettings = [
  { name: "Preferences", icon: <Settings size={16} />, path: "/preferences" },
  {
    name: "Help & Support",
    icon: <HelpCircle size={16} />,
    path: "/help-support",
  },
];

const baseLinkClass =
  "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-sm w-full";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const { logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const isDark = theme === "dark";
  const isActive = (path: string) => location.pathname === path;

  // ── Tokens sémantiques selon le thème ──────────────────────────────────────
  const t = {
    // Wrappers
    shell: isDark ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900",
    // Sidebar
    sidebar: isDark
      ? "bg-slate-900/40 backdrop-blur-xl border-slate-800/60"
      : "bg-white border-slate-200",
    // Header / footer dividers
    divider: isDark ? "border-slate-800/60" : "border-slate-200",
    // Logo accent
    accent: isDark ? "text-fuchsia-400" : "text-violet-600",
    // Section labels
    label: isDark ? "text-slate-500" : "text-slate-500",
    // Nav items — idle
    navIdle: isDark
      ? "text-slate-300 hover:bg-slate-800/60 hover:text-white"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
    // Nav items — active
    navActive: isDark
      ? "bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20"
      : "bg-violet-50 text-violet-700 border border-violet-200",
    // Active dot
    dot: isDark ? "bg-fuchsia-400" : "bg-violet-500",
    // Topbar
    topbar: isDark
      ? "bg-slate-950 border-slate-800/60"
      : "bg-white border-slate-200",
    // Topbar toggle icon
    toggleIcon: isDark
      ? "text-slate-300 hover:bg-slate-800/60 hover:text-white"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
    // Logout
    logout: isDark
      ? "text-slate-300 hover:bg-red-500/10 hover:text-red-300"
      : "text-slate-500 hover:bg-red-50 hover:text-red-600",
    // Glow (dark only, invisible in light)
    glow: isDark ? "bg-fuchsia-500/10" : "bg-transparent",
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${t.shell}`}>
      {/* ── Sidebar ── */}
      <aside
        className={`
          relative flex flex-col flex-none
          border-r ${t.sidebar}
          transition-[width] duration-300 ease-in-out
          overflow-hidden
          ${isOpen ? "w-64" : "w-0"}
        `}
      >
        {/* Glow — dark mode only */}
        <div
          className={`pointer-events-none absolute -top-10 -right-10 w-40 h-40 blur-3xl rounded-full ${t.glow}`}
        />

        {/* Header */}
        <div
          className={`flex items-center px-4 py-4 border-b ${t.divider} w-64`}
        >
          <Link to="/" className="flex items-center gap-2">
            <Cpu className={t.accent} size={18} />
            <span className="font-bold text-lg whitespace-nowrap">
              IDS<span className={t.accent}>-ML</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 w-64">
          {[
            { label: "General", items: navItemsGeneral },
            { label: "Actions", items: navItemsSuggestions },
            { label: "Settings", items: navItemsSettings },
          ].map((section) => (
            <div key={section.label}>
              <p
                className={`text-[11px] uppercase tracking-[0.2em] ${t.label} mb-2 whitespace-nowrap`}
              >
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`${baseLinkClass} ${active ? t.navActive : t.navIdle}`}
                    >
                      {item.icon}
                      <span className="whitespace-nowrap">{item.name}</span>
                      {active && (
                        <span
                          className={`ml-auto w-1.5 h-1.5 rounded-full ${t.dot}`}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer — theme toggle + logout */}
        <div className={`p-3 border-t ${t.divider} w-64 space-y-1`}>
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`${baseLinkClass} ${t.toggleIcon}`}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span className="whitespace-nowrap">
              {isDark ? "Light mode" : "Dark mode"}
            </span>
          </button>

          {/* Logout */}
          <button onClick={logout} className={`${baseLinkClass} ${t.logout}`}>
            <LogOut size={16} />
            <span className="whitespace-nowrap">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Zone droite ── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Toggle bar */}
        <div
          className={`h-10 shrink-0 flex items-center px-2 border-b ${t.topbar}`}
        >
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 rounded-lg transition ${t.toggleIcon}`}
          >
            {isOpen ? (
              <PanelLeftClose size={18} />
            ) : (
              <PanelLeftOpen size={18} />
            )}
          </button>
        </div>

        {/* Contenu */}
        <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
