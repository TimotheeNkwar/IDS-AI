import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AlertsCharts({ data }: { data: any[] }) {
  return (
    <>
      <div className="w-full bg-slate-900 p-6 rounded-2xl overflow-hidden">
        {" "}
        <h2 className="text-white font-semibold mb-4">Attacks by Type</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
          >
            <XAxis type="number" tick={{ fill: "#94a3b8" }} />
            <YAxis
              dataKey="_id"
              type="category"
              width={80}
              tick={{ fill: "#94a3b8" }}
            />
            <Bar dataKey="count" fill="#c23ecb" radius={[0, 4, 4, 0]} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "none" }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
