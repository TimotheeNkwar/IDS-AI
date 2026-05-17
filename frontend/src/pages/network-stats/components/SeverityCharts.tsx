import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { Shield, Sparkles } from "lucide-react";

const COLORS = [
  "#ec4899", // violet/pink
  "#3b82f6", // blue
  "#f59e0b", // optional fallback (if more data)
];

export default function SeverityChart({ data }: { data: any[] }) {
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
          <Shield className="w-4 h-4 text-fuchsia-400" />

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Analytics
            </p>
            <h2 className="text-xl font-bold text-white">
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
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />

              <Legend
                wrapperStyle={{
                  color: "#94a3b8",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Sparkles className="w-4 h-4 text-fuchsia-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500 uppercase tracking-widest">
                Severity
              </p>
              <p className="text-white font-semibold text-sm">Distribution</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
