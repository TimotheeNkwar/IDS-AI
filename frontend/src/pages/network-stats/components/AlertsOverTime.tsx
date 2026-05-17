import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Activity, TrendingUp } from "lucide-react";
import { useThemeStore } from "../../../stores/themeStore";

const SEVERITY_COLORS = { high: "#ec4899", medium: "#8b5cf6" };

export default function AlertsOverTime({ data }: { data: any[] }) {
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
    cursor: isDark ? "rgba(236,72,153,0.2)" : "rgba(139,92,246,0.2)",
    legendColor: isDark ? "#94a3b8" : "#64748b",
    footer: isDark ? "text-slate-500" : "text-slate-400",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-6 ${t.card}`}
    >
      <div
        className={`absolute -top-10 -right-10 w-40 h-40 rounded-full ${t.glowA}`}
      />
      <div
        className={`absolute -bottom-10 -left-10 w-40 h-40 rounded-full ${t.glowB}`}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-5">
          <Activity className={`w-4 h-4 ${t.headerIcon}`} />
          <div>
            <p
              className={`text-[11px] uppercase tracking-[0.2em] font-semibold ${t.label}`}
            >
              Analytics
            </p>
            <h2 className={`text-xl font-bold ${t.title}`}>Alerts Over Time</h2>
          </div>
        </div>

        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="hour"
                tick={{ fill: t.axisTick, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
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
                cursor={{ stroke: t.cursor, strokeWidth: 1 }}
              />
              <Legend
                wrapperStyle={{ color: t.legendColor, fontSize: "12px" }}
              />
              {Object.entries(SEVERITY_COLORS).map(([key, color]) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={`flex items-center gap-2 mt-4 text-xs ${t.footer}`}>
          <TrendingUp className="w-3.5 h-3.5" />
          Real-time threat activity trends
        </div>
      </div>
    </div>
  );
}
