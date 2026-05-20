import { Activity, ShieldCheck, AlertTriangle } from "lucide-react";
import { useThemeStore } from "../../../stores/themeStore";

export default function TotalTrafficSummary({ summary }: { summary: any }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const total = summary?.total ?? 0;
  const normal = summary?.normal ?? 0;
  const anomalies =
    summary?.anomalies?.reduce(
      (acc: number, item: any) => acc + item.count,
      0,
    ) ?? 0;

  // ── Tokens ─────────────────────────────────────────────────────────────────
  const t = {
    card: isDark
      ? "border-slate-700/60 bg-slate-900/70 backdrop-blur-xl"
      : "border-slate-200 bg-white",
    label: isDark ? "text-slate-500" : "text-slate-400",
    cardTitle: isDark ? "text-slate-300" : "text-slate-600",
    value: isDark ? "text-white" : "text-slate-900",
    iconBox: isDark
      ? "border-slate-700 bg-slate-800/60 text-slate-300"
      : "border-slate-200 bg-slate-100 text-slate-500",
    barTrack: isDark ? "bg-slate-800" : "bg-slate-100",
  };

  // Per-card accent — same hues, adjusted stops for light
  const cards = [
    {
      title: "Total Traffic",
      value: total,
      icon: Activity,
      gradient: isDark
        ? "from-fuchsia-500/20 to-fuchsia-700/10 border-fuchsia-500/20 text-fuchsia-300"
        : "from-fuchsia-100    to-fuchsia-50      border-fuchsia-200     text-fuchsia-600",
      glow: isDark ? "shadow-fuchsia-500/10" : "",
    },
    {
      title: "Normal Traffic",
      value: normal,
      icon: ShieldCheck,
      gradient: isDark
        ? "from-cyan-500/20 to-cyan-700/10 border-cyan-500/20 text-cyan-300"
        : "from-cyan-100    to-cyan-50      border-cyan-200    text-cyan-600",
      glow: isDark ? "shadow-cyan-500/10" : "",
    },
    {
      title: "Anomalous Traffic",
      value: anomalies,
      icon: AlertTriangle,
      gradient: isDark
        ? "from-red-500/20 to-red-700/10 border-red-500/20 text-red-300"
        : "from-red-100    to-red-50      border-red-200    text-red-600",
      glow: isDark ? "shadow-red-500/10" : "",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`
              group relative overflow-hidden
              rounded-3xl border p-6 text-left
              transition-all duration-300
              hover:-translate-y-1 hover:shadow-2xl ${card.glow}
              ${t.card}
            `}
          >
            {/* Hover glow overlay */}
            <div
              className={`
                absolute inset-0 opacity-0 group-hover:opacity-100
                transition-opacity duration-500
                bg-gradient-to-br ${card.gradient}
              `}
            />

            <div className="relative flex items-start justify-between">
              <div>
                <p
                  className={`text-xs uppercase tracking-[0.2em] font-semibold mb-2 ${t.label}`}
                >
                  Traffic
                </p>
                <h2 className={`text-sm font-medium mb-3 ${t.cardTitle}`}>
                  {card.title}
                </h2>
                <p className={`text-4xl font-bold ${t.value}`}>{card.value}</p>
              </div>

              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${t.iconBox}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            {/* Bottom accent line */}
            <div
              className={`mt-5 h-1 w-full rounded-full overflow-hidden ${t.barTrack}`}
            >
              <div
                className={`h-full w-full bg-gradient-to-r ${card.gradient}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
