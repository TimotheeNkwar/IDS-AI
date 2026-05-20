import type { Alert } from "../../../../types/types";
import { useThemeStore } from "../../../../stores/themeStore";

export default function TopFeatures({ alert }: { alert: Alert | null }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  // ── Tokens ─────────────────────────────────────────────────────────────────
  const t = {
    divider:      isDark ? "border-slate-800/50"                                          : "border-slate-200",
    sectionLabel: isDark ? "text-slate-500"                                               : "text-slate-400",
    empty:        isDark ? "text-slate-500"                                               : "text-slate-400",
    card:         isDark ? "bg-slate-900/40 backdrop-blur-md border-slate-700/40 hover:border-slate-600/60"
                         : "bg-violet-50 border-violet-200 hover:border-violet-300",
    featureName:  isDark ? "text-slate-300"                                               : "text-violet-700",
    featureAccent:isDark ? "text-fuchsia-400"                                             : "text-violet-600",
    barTrack:     isDark ? "bg-slate-800"                                                 : "bg-violet-200",
    barFill:      "bg-gradient-to-r from-fuchsia-500 to-purple-500", // identique
    meta:         isDark ? "text-slate-500"                                               : "text-violet-400",
  };

  return (
    <div className={`mt-4 pb-4 border-b ${t.divider}`}>

      <h3 className={`text-xs uppercase tracking-widest font-semibold mb-3 ${t.sectionLabel}`}>
        Top Features
      </h3>

      {!alert?.top_features?.length ? (
        <p className={`text-xs ${t.empty}`}>No feature data available</p>
      ) : (
        <div className="space-y-3">
          {alert.top_features.map((f, i) => {
            const percent = (f.importance * 100).toFixed(1);
            return (
              <div key={i} className={`border rounded-xl p-3 transition ${t.card}`}>

                {/* TOP ROW */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-mono ${t.featureName}`}>
                    {f.name}
                  </span>
                  <span className={`text-xs font-semibold ${t.featureAccent}`}>
                    {percent}%
                  </span>
                </div>

                {/* PROGRESS BAR */}
                <div className={`w-full h-2 rounded-full overflow-hidden ${t.barTrack}`}>
                  <div
                    className={`h-full rounded-full ${t.barFill}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* VALUE INFO */}
                <div className={`mt-2 text-[11px] flex justify-between ${t.meta}`}>
                  <span>value: {f.value}</span>
                  <span>impact score</span>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}