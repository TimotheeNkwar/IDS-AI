import type { Alert } from "../../../../types/types";
import { useThemeStore } from "../../../../stores/themeStore";

export default function ConfidenceInfo({ alert }: { alert: Alert | null }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  // ── Tokens ─────────────────────────────────────────────────────────────────
  const t = {
    divider: isDark ? "border-slate-800/50" : "border-slate-200",
    sectionLabel: isDark ? "text-slate-500" : "text-slate-400",
    card: isDark
      ? "bg-slate-900/40 backdrop-blur-md border-slate-700/40 hover:border-slate-600/60"
      : "bg-slate-50 border-slate-200 hover:border-slate-300",
    cardLabel: isDark ? "text-slate-500" : "text-slate-400",
  };

  const getColor = (v: number) => {
    if (v >= 0.8) return isDark ? "text-green-400" : "text-green-600";
    if (v >= 0.5) return isDark ? "text-yellow-400" : "text-yellow-600";
    return isDark ? "text-red-400" : "text-red-600";
  };

  const formatConfidence = (v: number) => `${Math.round(v * 100)}%`;

  const items = [
    { label: "ML", value: alert?.ml_confidence ?? 0 },
    { label: "LLM", value: alert?.llm_confidence ?? 0 },
    { label: "Final", value: alert?.final_confidence ?? 0 },
  ];

  return (
    <div className={`mt-4 pb-4 border-b ${t.divider}`}>
      <h3
        className={`text-xs uppercase tracking-widest font-semibold mb-3 ${t.sectionLabel}`}
      >
        Confidence Scores
      </h3>

      <div className="grid grid-cols-3 gap-3 text-center">
        {items.map((item) => (
          <div
            key={item.label}
            className={`border rounded-xl p-3 transition ${t.card}`}
          >
            <p
              className={`text-[11px] uppercase tracking-wider mb-1 ${t.cardLabel}`}
            >
              {item.label}
            </p>
            <p className={`text-lg font-semibold ${getColor(item.value)}`}>
              {formatConfidence(item.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
