import AlertsCharts from "./components/AlertsCharts";
import { useStats, useTrafficSummary } from "../../hooks/useStats";
import SeverityCharts from "./components/SeverityCharts";
import AlertsOverTime from "./components/AlertsOverTime";
import TotalTrafficSummary from "./components/TotalTrafficSummary";
import TrafficChart from "./components/TrafficChart.tsx";
import ProtocolChart from "./components/ProtocolChart.tsx";
import ServiceChart from "./components/ServiceChart.tsx";
import Loader from "../../components/Loader.tsx";

export default function NetworkStatsPage() {
  const { data: stats, error, isPending } = useStats(100);
  const { data: summary } = useTrafficSummary(100);

  if (isPending) return <Loader />;
  return (
    <div className="p-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur-xl p-5 mb-6">
        {/* subtle glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-fuchsia-500/10 blur-3xl rounded-full" />

        <div className="relative flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-fuchsia-400" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
                Network
              </p>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-white">
              Network Stats
            </h1>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">Last 24 hours</p>
            <p className="text-sm font-semibold text-white">
              {summary?.total ?? 0} connections
            </p>
          </div>
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
