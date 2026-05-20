import type { Alert } from "../../../../types/types";
import { useThemeStore } from "../../../../stores/themeStore";

export default function NetworkInfo({ alert }: { alert: Alert | null }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  // ── Tokens ─────────────────────────────────────────────────────────────────
  const t = {
    divider: isDark ? "border-slate-800/50" : "border-slate-200",
    sectionLabel: isDark ? "text-slate-500" : "text-slate-700",
    card: isDark
      ? "bg-slate-900/40 backdrop-blur-md border-slate-700/40 hover:border-slate-600/60"
      : "bg-slate-50 border-slate-200 hover:border-slate-300",
    cardLabel: isDark ? "text-slate-500" : "text-slate-600",
    cardValue: isDark ? "text-slate-200" : "text-slate-800",
    highlightYes: isDark ? "text-green-400" : "text-green-600",
    highlightNo: isDark ? "text-yellow-400" : "text-yellow-600",
  };

  const items = [
    { label: "Source IP", value: alert?.source_ip },
    { label: "Destination IP", value: alert?.destination_ip },
    { label: "Classification", value: alert?.classification },
    {
      label: "Needs Review",
      value: alert?.needs_manual_review ? "Yes" : "No",
      highlight: alert?.needs_manual_review ? t.highlightYes : t.highlightNo,
    },
    { label: "Source Port", value: alert?.source_port || "N/A" },
    { label: "Destination Port", value: alert?.destination_port || "N/A" },
  ];

  return (
    <div className={`mt-4 mb-4 pb-4 border-b ${t.divider}`}>
      <h3
        className={`text-xs uppercase tracking-widest font-semibold mb-3 ${t.sectionLabel}`}
      >
        Network
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
            <p
              className={`text-sm font-medium ${item.highlight ?? t.cardValue}`}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
