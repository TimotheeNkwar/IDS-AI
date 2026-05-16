import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

const COLORS = ["oklch(52.5% 0.223 3.958)", "oklch(75% 0.183 55.934)"]; // violet + bleu

export default function SeverityChart({ data }: { data: any[] }) {
  return (
    <div className="w-full bg-slate-900 p-6 rounded-2xl overflow-hidden">
      <h2 className="text-white font-semibold mb-4">Attacks by Severity</h2>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="_id">
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
