import AlertsCharts from "./components/AlertsCharts";
import { useStats, useTrafficSummary } from "../../hooks/useStats";
import SeverityCharts from "./components/SeverityCharts";
import AlertsOverTime from "./components/AlertsOverTime";

export default function NetworkStatsPage() {
  const { data: stats, error, isPending } = useStats(24);
  const { data: summary } = useTrafficSummary(24);

  if (isPending) return <p>Chargement...</p>;
  return (
    <div>
      <h1>Network Stats</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AlertsCharts data={stats?.attacks_by_type} />
        <SeverityCharts data={stats?.attacks_by_severity} />
        <AlertsOverTime data={stats?.alerts_over_time ?? []} />{" "}
        {/* ← direct, pas de map */}
      </div>
    </div>
  );
}
