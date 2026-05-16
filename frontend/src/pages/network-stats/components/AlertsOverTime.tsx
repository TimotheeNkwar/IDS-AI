import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const SEVERITY_COLORS = {
  high: "#ec0763",
  medium: "#930aef",
};

export default function AlertsOverTime({ data }: { data: any[] }) {
  return (
    <div className="w-full bg-slate-900 p-6 rounded-2xl overflow-hidden">
      <h2 className="text-white font-semibold mb-4">Alerts over Time</h2>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="hour" tick={{ fill: "#94a3b8" }} />
          <YAxis tick={{ fill: "#94a3b8" }} />
          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none" }} />
          <Legend />

          {Object.entries(SEVERITY_COLORS).map(([key, color]) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}