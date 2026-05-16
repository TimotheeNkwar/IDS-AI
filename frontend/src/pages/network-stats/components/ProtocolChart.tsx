import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
const COLORS = ["#c23ecb", "#8884d8", "#06b6d4", "#f59e0b"];

export default function ProtocolChart({ data }: { data: any[] }) {
  return (
    <div className="w-full bg-slate-900 p-6 rounded-2xl overflow-hidden">
      <h2 className="text-white font-semibold mb-4">Traffic by Protocol</h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="_id"
            innerRadius={60}
            outerRadius={90}
          >
            {data?.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
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
