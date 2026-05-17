import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle } from "lucide-react";

const COLORS = ["#10b981", "#ec4899", "#f59e0b"];

export default function TrafficChart({
  data,
  normal,
}: {
  data: any[];
  normal: number;
}) {
  if (!data || !Array.isArray(data)) return null;

  const chartData = [{ _id: "normal", count: normal }, ...data];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-xl p-6">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-fuchsia-500/10 blur-3xl rounded-full" />

      <div className="flex items-center gap-2 mb-5">
        <AlertTriangle className="w-4 h-4 text-fuchsia-400" />
        <h2 className="text-xl font-bold text-white">Traffic Distribution</h2>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="_id"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                  stroke="transparent"
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

            <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
