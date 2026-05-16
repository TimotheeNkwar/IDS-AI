import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "oklch(69.6% 0.17 162.48)",
  "oklch(52.5% 0.223 3.958)",
  "oklch(87.5% 0.15 45.934)",
];

export default function AnomaliesChart({
  data,
  normal,
}: {
  data: any[];
  normal: number;
}) {
  if (!data || !Array.isArray(data)) return null;

  const chartData = [{ _id: "normal", count: normal }, ...data];

  return (
    <div className="w-full bg-slate-900 p-6 rounded-2xl overflow-hidden">
      <h2 className="text-white font-semibold mb-4">Traffic Distribution</h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="_id"
            innerRadius={60}
            outerRadius={90}
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "none" }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
