import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Network } from "lucide-react";
import { useChartTokens } from "../../../hooks/useChartTokens";

const COLORS = ["#ec4899", "#8b5cf6", "#06b6d4", "#f59e0b"];

export default function ProtocolChart({ data }: { data: any[] }) {
  const t = useChartTokens();

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-6 ${t.card}`}
    >
      <div
        className={`absolute -bottom-10 -left-10 w-40 h-40 rounded-full ${t.glowCyan}`}
      />

      <div className="flex items-center gap-2 mb-5">
        <Network className={`w-4 h-4 ${t.iconCyan}`} />
        <h2 className={`text-xl font-bold ${t.title}`}>Traffic by Protocol</h2>
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
                backgroundColor: t.tooltipBg,
                border: `1px solid ${t.tooltipBorder}`,
                borderRadius: "12px",
                color: t.tooltipColor,
              }}
            />
            <Legend wrapperStyle={{ color: t.legendColor, fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
