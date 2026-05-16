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
  "flex items-center gap-3 px-2 py-2 rounded-lg transition-colors cursor-pointer text-sm w-full";
const inactiveClass = "text-gray-300 hover:bg-slate-700/50 hover:text-white";
const activeClass = "bg-fuchsia-600 text-white";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuthStore();

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `${baseLinkClass} ${isActive ? activeClass : inactiveClass}`;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950">
      {/* ── Sidebar ── */}
      <div
        className={`
        flex flex-col bg-slate-900
        transition-all duration-300
        overflow-hidden shrink-0
        ${isOpen ? "w-60" : "w-0"}
      `}
      >
        <div className="flex flex-col h-full px-4 py-4 w-60">
          {/* Logo */}
          <div className="text-3xl font-extrabold flex items-center mb-10 whitespace-nowrap">
            <Link to="/" className="flex items-center gap-1">
              <span className="text-white">IDS-</span>
              <span className="bg-clip-text text-transparent bg-linear-to-r from-pink-500 to-fuchsia-500">
                ML
              </span>
            </Link>
          </div>

          {/* Nav */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {[
              { label: "General", items: navItemsGeneral },
              { label: "Suggestions", items: navItemsSuggestions },
              { label: "Settings", items: navItemsSettings },
            ].map(({ label, items }) => (
              <div key={label} className="mb-6">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 whitespace-nowrap">
                  {label}
                </p>
                <ul className="flex flex-col gap-1">
                  {items.map((item) => (
                    <li key={item.path}>
                      <Link to={item.path} className={getLinkClass(item.path)}>
                        {item.icon}
                        <span className="whitespace-nowrap">{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Logout */}
          <div className="mt-auto pt-4 border-t border-slate-700">
            <button
              onClick={logout}
              className={`${baseLinkClass} ${inactiveClass}`}
            >
              <LogOut size={16} />
              <span className="whitespace-nowrap">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Zone droite : toggle + contenu ── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Toggle bar */}
        <div className="h-10 shrink-0 bg-gray-950 flex items-center px-1">
          <button
            className="btn btn-square btn-sm bg-gray-950 border-none text-gray-300 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <PanelLeftClose size={18} />
            ) : (
              <PanelLeftOpen size={18} />
            )}
          </button>
        </div>

        {/* Page content */}
        <div className="flex-1 container mx-auto overflow-y-auto text-gray-100  px-10 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
