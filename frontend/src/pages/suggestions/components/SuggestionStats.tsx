import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import type { Suggestion } from "../../../types/types";

export default function SuggestionStats({
  suggestions = [],
}: {
  suggestions: Suggestion[];
}) {
  const high = suggestions.filter((s) => s.priority === "high").length;
  const medium = suggestions.filter((s) => s.priority === "medium").length;
  const total = suggestions.length;

  const stats = [
    {
      title: "Total Suggestions",
      value: total,
      icon: ShieldCheck,
      gradient: "from-slate-700 to-slate-800",
      gradientLight: "from-slate-200 to-slate-300",
      iconBg:
        "bg-cyan-500/20 text-cyan-300 light:bg-cyan-50 light:text-cyan-600",
      border: "border-cyan-500/20 light:border-cyan-200",
      glow: "shadow-cyan-500/10",
    },
    {
      title: "High Priority",
      value: high,
      icon: ShieldAlert,
      gradient: "from-red-500/20 to-red-700/10",
      gradientLight: "from-red-100 to-red-200/60",
      iconBg: "bg-red-500/20 text-red-300 light:bg-red-50 light:text-red-500",
      border: "border-red-500/20 light:border-red-200",
      glow: "shadow-red-500/10",
    },
    {
      title: "Medium Priority",
      value: medium,
      icon: AlertTriangle,
      gradient: "from-yellow-500/20 to-yellow-700/10",
      gradientLight: "from-yellow-100 to-yellow-200/60",
      iconBg:
        "bg-yellow-500/20 text-yellow-300 light:bg-yellow-50 light:text-yellow-600",
      border: "border-yellow-500/20 light:border-yellow-200",
      glow: "shadow-yellow-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <div
            key={index}
            className={`
              group relative overflow-hidden
              rounded-3xl border ${stat.border}
              bg-slate-900/70 backdrop-blur-xl
              light:bg-white/70
              p-5 transition-all duration-300
              hover:-translate-y-1
              hover:shadow-2xl ${stat.glow}
            `}
          >
            {/* Hover glow — dark only */}
            <div
              className={`
                absolute inset-0 opacity-0 group-hover:opacity-100
                transition-opacity duration-500
                bg-gradient-to-br ${stat.gradient}
                light:hidden
              `}
            />
            {/* Hover glow — light only */}
            <div
              className={`
                absolute inset-0 opacity-0 group-hover:opacity-100
                transition-opacity duration-500
                bg-gradient-to-br ${stat.gradientLight}
                hidden light:block
              `}
            />

            {/* Content */}
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-fuchsia-400 light:text-fuchsia-500" />
                  <p className="uppercase tracking-[0.2em] text-[10px] font-semibold text-slate-500 light:text-slate-400">
                    Analytics
                  </p>
                </div>

                <h3 className="text-slate-300 light:text-slate-600 text-sm font-medium mb-3">
                  {stat.title}
                </h3>

                <p className="text-4xl font-bold text-white light:text-slate-900 tracking-tight">
                  {stat.value}
                </p>
              </div>

              {/* Icon */}
              <div
                className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center
                  border border-white/5 light:border-transparent
                  ${stat.iconBg}
                `}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative mt-5 h-1 w-full overflow-hidden rounded-full bg-slate-800 light:bg-slate-100">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${stat.gradient} light:bg-gradient-to-r light:${stat.gradientLight}`}
                style={{
                  width: `${Math.max(15, total > 0 ? (stat.value / total) * 100 : 0)}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
