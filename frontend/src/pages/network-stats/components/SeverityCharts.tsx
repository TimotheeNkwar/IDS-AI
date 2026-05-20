import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { Shield, Sparkles } from "lucide-react";
import { useThemeStore } from "../../../stores/themeStore";

const COLORS = ["#ec4899", "#3b82f6", "#f59e0b"];

export default function SeverityChart({ data }: { data: any[] }) {
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
    tooltipBg: isDark ? "#0f172a" : "#ffffff",
    tooltipBorder: isDark ? "#334155" : "#e2e8f0",
    tooltipColor: isDark ? "#fff" : "#1e293b",
    legendColor: isDark ? "#94a3b8" : "#64748b",
    centerIcon: isDark ? "text-fuchsia-400" : "text-violet-500",
    centerLabel: isDark ? "text-slate-500" : "text-slate-400",
    centerValue: isDark ? "text-white" : "text-slate-900",
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
          <Shield className={`w-4 h-4 ${t.headerIcon}`} />
          <div>
            <p
              className={`text-[11px] uppercase tracking-[0.2em] font-semibold ${t.label}`}
            >
              Analytics
            </p>
            <h2 className={`text-xl font-bold ${t.title}`}>
              Attacks by Severity
            </h2>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[260px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="_id"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={3}
                stroke="transparent"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: t.tooltipBg,
                  border: `1px solid ${t.tooltipBorder}`,
                  borderRadius: "12px",
                  color: t.tooltipColor,
                }}
              />
              <Legend
                wrapperStyle={{ color: t.legendColor, fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Sparkles className={`w-4 h-4 mx-auto mb-1 ${t.centerIcon}`} />
              <p
                className={`text-xs uppercase tracking-widest ${t.centerLabel}`}
              >
                Severity
              </p>
              <p className={`font-semibold text-sm ${t.centerValue}`}>
                Distribution
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
