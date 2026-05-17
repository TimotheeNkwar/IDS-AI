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
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore.ts";

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

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-white">
      {/* ── Sidebar ── */}
      <aside
        className={`
          relative flex flex-col flex-none
          border-r border-slate-800/60
          bg-slate-900/40 backdrop-blur-xl
          transition-[width] duration-300 ease-in-out
          overflow-hidden
          ${isOpen ? "w-64" : "w-0"}
        `}
      >
        {/* Glow */}
        <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 bg-fuchsia-500/10 blur-3xl rounded-full" />

        {/* Header */}
        <div className="flex items-center px-4 py-4 border-b border-slate-800/60 w-64">
          <Link to="/" className="flex items-center gap-2">
            <Cpu className="text-fuchsia-400" size={18} />
            <span className="font-bold text-lg whitespace-nowrap">
              IDS<span className="text-fuchsia-400">-ML</span>
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
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-2 whitespace-nowrap">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        ${baseLinkClass}
                        ${
                          active
                            ? "bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20"
                            : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                        }
                      `}
                    >
                      {item.icon}
                      <span className="whitespace-nowrap">{item.name}</span>
                      {active && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-slate-800/60 w-64">
          <button
            onClick={logout}
            className={`${baseLinkClass} text-slate-300 hover:bg-red-500/10 hover:text-red-300`}
          >
            <LogOut size={16} />
            <span className="whitespace-nowrap">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Zone droite ── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Toggle bar — toujours visible */}
        <div className="h-10 shrink-0 bg-slate-950 flex items-center px-2 border-b border-slate-800/60">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-slate-800/60 transition text-slate-300 hover:text-white"
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
