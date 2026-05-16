import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#c23ecb", "#8884d8", "#06b6d4", "#f59e0b"];
export default function ServiceChart({ data }: { data: any[] }) {
  const chartData =
    data?.map((item, index) => ({
      ...item,
      _id: item?._id === "-" ? "unknown" : item?._id,
      fill: COLORS[index % COLORS.length],
    })) ?? [];

  return (
    <div className="w-full bg-slate-900 p-6 rounded-2xl overflow-hidden">
      <h2 className="text-white font-semibold mb-4">Traffic by Service</h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="total"
            nameKey="_id"
            innerRadius={60}
            outerRadius={90}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "none" }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
