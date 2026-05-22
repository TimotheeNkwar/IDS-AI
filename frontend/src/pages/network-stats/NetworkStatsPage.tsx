import AlertsCharts from "./components/AlertsCharts";
import { useStats, useTrafficSummary } from "../../hooks/useStats";
import SeverityCharts from "./components/SeverityCharts";
import AlertsOverTime from "./components/AlertsOverTime";
import TotalTrafficSummary from "./components/TotalTrafficSummary";
import TrafficChart from "./components/TrafficChart.tsx";
import ProtocolChart from "./components/ProtocolChart.tsx";
import ServiceChart from "./components/ServiceChart.tsx";
import Loader from "../../components/Loader.tsx";
import { useThemeStore } from "../../stores/themeStore";
import useAppStore from "../../stores/AppStore.ts";
import useHourDayText from "../../hooks/useHourDayText.ts";
import { formatCount } from "../../lib/utils.ts";

export default function NetworkStatsPage() {
  const { hours, setHours } = useAppStore();
  const { data: stats, isPending } = useStats(hours);
  const { data: summary } = useTrafficSummary(hours);
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const HoursDayText = useHourDayText();

  // ── Tokens ─────────────────────────────────────────────────────────────────
  const t = {
    // Hero banner
    banner: isDark
      ? "border-slate-700/60 bg-slate-900/60 backdrop-blur-xl"
      : "border-slate-200 bg-white",
    glow: isDark ? "bg-fuchsia-500/10 blur-3xl" : "hidden",
    dot: isDark ? "bg-fuchsia-400" : "bg-violet-500",
    bannerLabel: isDark ? "text-slate-500" : "text-slate-400",
    bannerTitle: isDark ? "text-white" : "text-slate-900",
    bannerMeta: isDark ? "text-slate-400" : "text-slate-500",
    bannerValue: isDark ? "text-white" : "text-slate-900",
  };
  if (isPending) return <Loader />;

  return (
    <div className="p-6">
      {/* HERO BANNER */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-5 mb-6 ${t.banner}`}
      >
        {/* glow — dark only */}
        <div
          className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${t.glow}`}
        />

        <div className="relative flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${t.dot}`} />
              <p
                className={`text-[11px] uppercase tracking-[0.2em] font-semibold ${t.bannerLabel}`}
              >
                Network
              </p>
            </div>
            <h1 className={`text-xl md:text-2xl font-bold ${t.bannerTitle}`}>
              Network Stats
            </h1>
          </div>

          <div className="text-right">
            <p className={`text-xs ${t.bannerMeta}`}>Last {HoursDayText}</p>
            <p className={`text-sm font-semibold ${t.bannerValue}`}>
              {formatCount(summary?.total ?? 0)} connections
            </p>
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div>
        <TotalTrafficSummary summary={summary} />
      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <AlertsCharts data={stats?.attacks_by_type} />
        <SeverityCharts data={stats?.attacks_by_severity} />
      </div>

      {/* ALERTS OVER TIME */}
      <div className="mb-8">
        <AlertsOverTime data={stats?.alerts_over_time ?? []} />
      </div>

      {/* CHARTS ROW 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TrafficChart
          data={summary?.anomalies ?? []}
          normal={summary?.normal ?? 0}
        />
        <ProtocolChart data={stats?.traffic_by_protocol} />
        <ServiceChart data={stats?.traffic_by_service} />
      </div>
    </div>
  );
}
