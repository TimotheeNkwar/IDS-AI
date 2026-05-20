import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { useChartTokens } from "../../../hooks/useChartTokens";

const COLORS = ["#10b981", "#ec4899", "#f59e0b"];

export default function TrafficChart({
  data,
  normal,
}: {
  data: any[];
  normal: number;
}) {
  const t = useChartTokens();

  if (!data || !Array.isArray(data)) return null;

  const chartData = [{ _id: "normal", count: normal }, ...data];

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-6 ${t.card}`}
    >
      <div
        className={`absolute -top-10 -right-10 w-40 h-40 rounded-full ${t.glowFuchsia}`}
      />

      <div className="flex items-center gap-2 mb-5">
        <AlertTriangle className={`w-4 h-4 ${t.iconFuchsia}`} />
        <h2 className={`text-xl font-bold ${t.title}`}>Traffic Distribution</h2>
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
