import AlertsCharts from "./components/AlertsCharts";
import { useStats, useTrafficSummary } from "../../hooks/useStats";
import SeverityCharts from "./components/SeverityCharts";
import AlertsOverTime from "./components/AlertsOverTime";
import TotalTrafficSummary from "./components/TotalTrafficSummary";
import TrafficChart from "./components/TrafficChart.tsx";
import ProtocolChart from "./components/ProtocolChart.tsx";
import ServiceChart from "./components/ServiceChart.tsx";

export default function NetworkStatsPage() {
  const { data: stats, error, isPending } = useStats(100);
  const { data: summary } = useTrafficSummary(100);

  if (isPending) return <p>Chargement...</p>;
  return (
    <div className="p-6">
      <div className="top mb-4">
        <h1 className="text-base md:text-lg lg:text-xl text-white font-semibold mb-8">
          Network Stats
        </h1>
        <div>
          <p className="text-sm text-base-content/40">
            Last 24 hours - {summary?.total ?? 0} connections
          </p>
        </div>
      </div>
      <div>
        <TotalTrafficSummary summary={summary} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        <AlertsCharts data={stats?.attacks_by_type} />
        <SeverityCharts data={stats?.attacks_by_severity} />
      </div>
      <div className="mb-8">
        <AlertsOverTime data={stats?.alerts_over_time ?? []} />{" "}
      </div>
      <div className="grid  grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TrafficChart data={summary?.anomalies} normal={summary?.normal} />
        <ProtocolChart data={stats?.traffic_by_protocol} />
        <ServiceChart data={stats?.traffic_by_service} />
      </div>
    </div>
  );
}
