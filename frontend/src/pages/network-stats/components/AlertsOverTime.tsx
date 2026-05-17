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

const SEVERITY_COLORS = {
  high: "#ec4899",
  medium: "#8b5cf6",
};

export default function AlertsOverTime({ data }: { data: any[] }) {
  return (
    <div
      className="
        relative overflow-hidden
        rounded-3xl border border-slate-700/60
        bg-slate-900/70 backdrop-blur-xl
        p-6
      "
    >
      {/* Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-fuchsia-500/10 blur-3xl rounded-full" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <Activity className="w-4 h-4 text-fuchsia-400" />

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Analytics
            </p>
            <h2 className="text-xl font-bold text-white">Alerts Over Time</h2>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="hour"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  color: "#fff",
                }}
                cursor={{ stroke: "rgba(236,72,153,0.2)", strokeWidth: 1 }}
              />

              <Legend
                wrapperStyle={{
                  color: "#94a3b8",
                  fontSize: "12px",
                }}
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

        {/* Footer hint */}
        <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
          <TrendingUp className="w-3.5 h-3.5" />
          Real-time threat activity trends
        </div>
      </div>
    </div>
  );
}
