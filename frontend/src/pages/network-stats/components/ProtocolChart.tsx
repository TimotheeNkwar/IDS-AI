import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Network } from "lucide-react";

const COLORS = ["#ec4899", "#8b5cf6", "#06b6d4", "#f59e0b"];

export default function ProtocolChart({ data }: { data: any[] }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-xl p-6">
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full" />

      <div className="flex items-center gap-2 mb-5">
        <Network className="w-4 h-4 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">Traffic by Protocol</h2>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="_id"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
            >
              {data?.map((_, index) => (
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
