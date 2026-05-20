import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { useThemeStore } from "../../../stores/themeStore";

export default function AlertsCharts({ data }: { data: any[] }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const t = {
    card: isDark
      ? "border-slate-700/60 bg-slate-900/70 backdrop-blur-xl"
      : "border-slate-200 bg-white",
    glowA: isDark ? "bg-fuchsia-500/10 blur-3xl" : "hidden",
    glowB: isDark ? "bg-cyan-500/10 blur-3xl" : "hidden",
    headerIcon: isDark ? "text-fuchsia-400" : "text-violet-500",
    label: isDark ? "text-slate-500" : "text-slate-400",
    title: isDark ? "text-white" : "text-slate-900",
    axisTick: isDark ? "#94a3b8" : "#64748b",
    tooltipBg: isDark ? "#0f172a" : "#ffffff",
    tooltipBorder: isDark ? "#334155" : "#e2e8f0",
    tooltipColor: isDark ? "#fff" : "#1e293b",
    cursor: isDark ? "rgba(236,72,153,0.05)" : "rgba(139,92,246,0.05)",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-6 ${t.card}`}
    >
      {/* Glows — dark only */}
      <div
        className={`absolute -top-10 -right-10 w-40 h-40 rounded-full ${t.glowA}`}
      />
      <div
        className={`absolute -bottom-10 -left-10 w-40 h-40 rounded-full ${t.glowB}`}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className={`w-4 h-4 ${t.headerIcon}`} />
          <div>
            <p
              className={`text-[11px] uppercase tracking-[0.2em] font-semibold ${t.label}`}
            >
              Analytics
            </p>
            <h2 className={`text-xl font-bold ${t.title}`}>Attacks by Type</h2>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 20, bottom: 10, left: 10 }}
            >
              <XAxis
                type="number"
                tick={{ fill: t.axisTick, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="_id"
                type="category"
                width={90}
                tick={{ fill: t.axisTick, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: t.tooltipBg,
                  border: `1px solid ${t.tooltipBorder}`,
                  borderRadius: "12px",
                  color: t.tooltipColor,
                }}
                cursor={{ fill: t.cursor }}
              />
              <Bar
                dataKey="count"
                fill="url(#colorGradient)"
                radius={[0, 8, 8, 0]}
                barSize={18}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
