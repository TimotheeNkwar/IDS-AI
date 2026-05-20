import type { Alert } from "../../../../types/types";
import { useThemeStore } from "../../../../stores/themeStore";

export default function RecommendedAction({ alert }: { alert: Alert | null }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const t = {
    sectionLabel: isDark ? "text-slate-500" : "text-slate-400",
    card: isDark
      ? "bg-gradient-to-r from-yellow-900/20 to-amber-900/10 border-yellow-500/20 backdrop-blur-md"
      : "bg-amber-50 border-amber-200",
    glow: isDark ? "opacity-20 bg-yellow-500 blur-2xl" : "hidden",
    bodyText: isDark ? "text-slate-100" : "text-amber-900",
    socLabel: isDark ? "text-yellow-300" : "text-amber-700",
    badge: isDark
      ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
      : "bg-amber-100 border-amber-300 text-amber-700",
  };

  return (
    <div className="mt-4">
      <h3
        className={`text-xs uppercase tracking-widest font-semibold mb-2 ${t.sectionLabel}`}
      >
        Recommended Action
      </h3>

      <div
        className={`relative p-4 rounded-xl border overflow-hidden ${t.card}`}
      >
        {/* subtle glow — dark only */}
        <div className={`absolute inset-0 ${t.glow}`} />

        <div className="relative">
          <p className={`text-sm leading-relaxed ${t.bodyText}`}>
            {alert?.recommended_action || "No recommendation available"}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <span className={`text-[11px] font-medium ${t.socLabel}`}>
              SOC Decision Layer
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full border ${t.badge}`}
            >
              action required
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
