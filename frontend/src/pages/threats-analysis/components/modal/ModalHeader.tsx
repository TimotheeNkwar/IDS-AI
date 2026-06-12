import { ShieldAlert, ShieldBan, X } from "lucide-react";
import type { Alert } from "../../../../types/types";
import { useThemeStore } from "../../../../stores/themeStore";

export default function ModalHeader({ alert }: { alert: Alert | null }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const severity = alert?.severity;
  const status   = alert?.status;

  // ── Tokens ─────────────────────────────────────────────────────────────────
  const t = {
    // Icon block
    iconHigh:     isDark ? "bg-red-500/10    border-red-500/20"    : "bg-red-50    border-red-200",
    iconMed:      isDark ? "bg-yellow-500/10 border-yellow-500/20" : "bg-yellow-50 border-yellow-200",
    iconHighClr:  isDark ? "text-red-400"                          : "text-red-600",
    iconMedClr:   isDark ? "text-yellow-400"                       : "text-yellow-600",

    // Alert type label
    typeText:     isDark ? "text-slate-100"                        : "text-slate-900",

    // Severity badge
    badgeHigh:    isDark ? "bg-red-500/10    text-red-300    border-red-500/20"
                         : "bg-red-50        text-red-600    border-red-200",
    badgeMed:     isDark ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
                         : "bg-yellow-50     text-yellow-700 border-yellow-200",

    // Status badge
    badgeOpen:    isDark ? "bg-green-500/10  text-green-300  border-green-500/20"
                         : "bg-green-50      text-green-700  border-green-200",
    badgeClosed:  isDark ? "bg-slate-500/10  text-slate-300  border-slate-500/20"
                         : "bg-slate-100     text-slate-600  border-slate-200",

    // Meta
    meta:         isDark ? "text-slate-500"                        : "text-slate-400",

    // Close button
    closeBtn:     isDark ? "bg-slate-800/40 hover:bg-slate-700/40 border-slate-700/40 text-slate-300 hover:text-white"
                         : "bg-slate-100    hover:bg-slate-200     border-slate-200     text-slate-500 hover:text-slate-900",
  };

  const isHigh = severity === "high";

  return (
    <div className="flex items-start justify-between gap-4">

      {/* LEFT SIDE */}
      <div className="flex items-start gap-3">

        {/* ICON BLOCK */}
        <div className={`p-2 rounded-xl border ${isHigh ? t.iconHigh : t.iconMed}`}>
          {isHigh ? (
            <ShieldBan  className={`w-5 h-5 ${t.iconHighClr}`} />
          ) : (
            <ShieldAlert className={`w-5 h-5 ${t.iconMedClr}`} />
          )}
        </div>

        {/* INFO */}
        <div className="flex flex-col">

          {/* TYPE + BADGES */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-semibold ${t.typeText}`}>
              {alert?.type}
            </p>

            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${isHigh ? t.badgeHigh : t.badgeMed}`}>
              {severity}
            </span>

            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${status === "open" ? t.badgeOpen : t.badgeClosed}`}>
              {status}
            </span>
          </div>

          {/* META */}
          <div className={`mt-1 text-[11px] flex gap-3 flex-wrap ${t.meta}`}>
            <span>
              {alert?.timestamp ? new Date(alert.timestamp).toLocaleString() : "—"}
            </span>
            <span className="font-mono">ID: {alert?.id}</span>
          </div>
        </div>
      </div>

      {/* CLOSE */}
      <form method="dialog">
        <button className={`w-8 h-8 rounded-lg border transition ${t.closeBtn} flex items-center justify-center`}>
          <X className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}