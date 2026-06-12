import { AlertTriangle } from "lucide-react";
import type { TrafficRecord } from "../../../types/types";
import { useThemeStore } from "../../../stores/themeStore";

export default function TrafficRowDetail({ row }: { row: TrafficRecord }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  // ── Tokens ─────────────────────────────────────────────────────────────────
  const t = {
    wrapper: isDark ? "border-slate-800/50" : "border-slate-200",
    sectionLabel: isDark ? "text-slate-500" : "text-slate-600",
    bodyText: isDark ? "text-slate-200" : "text-slate-700",

    // Recommended action banner
    actionBanner: isDark
      ? "bg-yellow-500/10 border-yellow-500/20"
      : "bg-yellow-50 border-yellow-200",
    actionIcon: isDark ? "text-yellow-400" : "text-yellow-600",
    actionText: isDark ? "text-yellow-100" : "text-yellow-800",

    // Evidence items
    evidenceItem: isDark
      ? "bg-slate-900/40 border-slate-800/50 text-slate-400"
      : "bg-slate-50 border-slate-200 text-slate-700",

    // Top feature cards
    featureCard: isDark
      ? "bg-slate-900/30 border-slate-800/50"
      : "bg-slate-50 border-slate-200",
    featureName: isDark ? "text-slate-300" : "text-slate-700",
    featureAccent: isDark ? "text-fuchsia-400" : "text-purple-800",
    featureBarTrack: isDark ? "bg-slate-800" : "bg-slate-200",
    featureMeta: isDark ? "text-slate-500" : "text-slate-400",

    // Meta footer
    metaDivider: isDark ? "border-slate-800/50" : "border-slate-200",
    metaLabel: isDark ? "text-slate-500" : "text-slate-400",
    metaValue: isDark ? "text-slate-300" : "text-slate-700",
    metaWarning: isDark ? "text-yellow-500 font-semibold" : "text-yellow-700 font-semibold",
  };

  return (
    <div className={`p-4 space-y-5  ${t.wrapper}`}>
      {/* EXPLANATION */}
      {row.explanation && (
        <div>
          <p
            className={`text-[11px] uppercase tracking-widest mb-2 ${t.sectionLabel}`}
          >
            Explanation
          </p>
          <p className={`text-sm leading-relaxed ${t.bodyText}`}>
            {row.explanation}
          </p>
        </div>
      )}

      {/* RECOMMENDED ACTION */}
      {row.recommended_action && (
        <div
          className={`flex items-start gap-2 p-3 rounded-xl border ${t.actionBanner}`}
        >
          <AlertTriangle className={`w-4 h-4 mt-0.5 ${t.actionIcon}`} />
          <p className={`text-sm ${t.actionText}`}>{row.recommended_action}</p>
        </div>
      )}

      {/* EVIDENCE */}
      {(row.evidence ?? []).length > 0 && (
        <div>
          <p
            className={`text-[11px] uppercase tracking-widest mb-2 ${t.sectionLabel}`}
          >
            Evidence
          </p>
          <ul className="space-y-1">
            {row.evidence!.map((e, i) => (
              <li
                key={i}
                className={`text-xs font-mono border rounded-lg px-3 py-2 ${t.evidenceItem}`}
              >
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* TOP FEATURES */}
      {row.top_features?.length > 0 && (
        <div>
          <p
            className={`text-[11px] uppercase tracking-widest mb-3 ${t.sectionLabel}`}
          >
            Top Features
          </p>
          <div className="space-y-3">
            {row.top_features.map((f, i) => {
              const percent = (f.importance * 100).toFixed(1);
              return (
                <div
                  key={i}
                  className={`border rounded-xl p-3 ${t.featureCard}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-mono ${t.featureName}`}>
                      {f.name}
                    </span>
                    <span className={`text-xs ${t.featureAccent}`}>
                      {percent}%
                    </span>
                  </div>

                  <div
                    className={`w-full h-1.5 rounded-full overflow-hidden ${t.featureBarTrack}`}
                  >
                    <div
                      className="h-full bg-fuchsia-500 light:bg-purple-700 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div
                    className={`mt-2 text-[11px] flex justify-between ${t.featureMeta}`}
                  >
                    <span>value: {f.value}</span>
                    <span>impact score</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* META INFO */}
      <div
        className={`flex flex-wrap gap-4 text-[11px] pt-1 border-t ${t.metaDivider} ${t.metaLabel}`}
      >
        {row.ml_model && (
          <span>
            Model: <span className={t.metaValue}>{row.ml_model}</span>
          </span>
        )}
        {row.llm_severity && (
          <span>
            LLM: <span className={t.metaValue}>{row.llm_severity}</span>
          </span>
        )}
        {row.final_confidence && (
          <span>
            Confidence:{" "}
            <span className={t.metaValue}>
              {(row.final_confidence * 100).toFixed(1)}%
            </span>
          </span>
        )}
        {row.needs_review && (
          <span className={`${t.metaWarning} flex items-center gap-1`}>
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
            Needs review
          </span>
        )}
      </div>
    </div>
  );
}
