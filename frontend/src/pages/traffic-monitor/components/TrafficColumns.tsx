import { createColumnHelper } from "@tanstack/react-table";
import {
  Clock,
  Shield,
  MonitorSmartphone,
  Network,
  Activity,
  Radio,
  AlertTriangle,
} from "lucide-react";
import type { TrafficRecord } from "../../../types/types";
import { formatDate } from "../../../lib/utils";
import { useThemeStore } from "../../../stores/themeStore.ts";

const columnHelper = createColumnHelper<TrafficRecord>();

// ── Tokens ────────────────────────────────────────────────────────────────────
// Called once per render — returns classes based on the current theme.
function useTokens() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return {
    // Headers
    headerText: isDark ? "text-slate-400" : "text-slate-700",

    // Standard text cells
    cellText: isDark ? "text-slate-200" : "text-slate-800",
    cellMuted: isDark ? "text-slate-300" : "text-slate-600",

    // Badge "Type" — always red (alert)
    badgeType: isDark
      ? "bg-red-500/10 text-red-300 border-red-500/20"
      : "bg-red-50    text-red-600  border-red-200",

    // ML confidence bar
    barTrack: isDark ? "bg-slate-800" : "bg-slate-200",
    barFill: "bg-purple-700", // identical in both themes

    // Badge "Protocol"
    badgeProtocol: isDark
      ? "bg-slate-800/40 border-slate-700/40 text-slate-300"
      : "bg-slate-100    border-slate-200     text-slate-600",

    // Badges "Severity"
    severity: {
      high: isDark
        ? "bg-red-500/10 text-red-300 border-red-500/20"
        : "bg-red-50    text-red-600  border-red-200",
      medium: isDark
        ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
        : "bg-yellow-50     text-yellow-700 border-yellow-200",
      low: isDark
        ? "bg-green-500/10  text-green-300  border-green-500/20"
        : "bg-green-50      text-green-700  border-green-200",
      fallback: isDark
        ? "bg-slate-800 text-slate-300 border-slate-700"
        : "bg-slate-100 text-slate-600 border-slate-200",
    },
  };
}

// ── Composant header réutilisable ─────────────────────────────────────────────
function ColHeader({
  icon,
  label,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  className: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 text-xs uppercase tracking-wider ${className}`}
    >
      {icon}
      {label}
    </div>
  );
}

// ── Colonnes ──────────────────────────────────────────────────────────────────
// Les cell renderers sont des composants React pour pouvoir appeler les hooks.

function TimestampCell({ value }: { value: string }) {
  const t = useTokens();
  return (
    <span className={`font-mono text-sm ${t.cellText}`}>
      {formatDate(value)}
    </span>
  );
}

function LabelCell({ value }: { value: string }) {
  const t = useTokens();
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${t.badgeType}`}
    >
      {value}
    </span>
  );
}

function IpCell({ value }: { value: string }) {
  const t = useTokens();
  return <span className={`font-mono text-sm ${t.cellText}`}>{value}</span>;
}

function MlCell({ value }: { value: number }) {
  const t = useTokens();
  const pct = value * 100;
  return (
    <div className="flex items-center gap-2">
      <div className={`w-20 h-1.5 rounded-full overflow-hidden ${t.barTrack}`}>
        <div
          className={`h-full rounded-full ${t.barFill}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-mono ${t.cellMuted}`}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

function ProtocolCell({ value }: { value: string }) {
  const t = useTokens();
  return (
    <span
      className={`text-xs font-mono px-2 py-0.5 rounded-md border ${t.badgeProtocol}`}
    >
      {value}
    </span>
  );
}

function SeverityCell({ value }: { value: string }) {
  const t = useTokens();
  const cls =
    t.severity[value as keyof typeof t.severity] ?? t.severity.fallback;
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}
    >
      {value}
    </span>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export function useColumns() {
  const t = useTokens();

  return [
    columnHelper.accessor("timestamp", {
      header: () => (
        <ColHeader
          icon={<Clock className="w-3.5 h-3.5" />}
          label="Time"
          className={t.headerText}
        />
      ),
      cell: (info) => <TimestampCell value={info.getValue()} />,
    }),

    columnHelper.accessor("label", {
      header: () => (
        <ColHeader
          icon={<Shield className="w-3.5 h-3.5" />}
          label="Type"
          className={t.headerText}
        />
      ),
      cell: (info) => <LabelCell value={info.getValue()} />,
    }),

    columnHelper.accessor("source_ip", {
      header: () => (
        <ColHeader
          icon={<MonitorSmartphone className="w-3.5 h-3.5" />}
          label="Source"
          className={t.headerText}
        />
      ),
      cell: (info) => <IpCell value={info.getValue()} />,
    }),

    columnHelper.accessor("destination_ip", {
      header: () => (
        <ColHeader
          icon={<Network className="w-3.5 h-3.5" />}
          label="Destination"
          className={t.headerText}
        />
      ),
      cell: (info) => <IpCell value={info.getValue()} />,
    }),

    columnHelper.accessor("ml_confidence", {
      header: () => (
        <ColHeader
          icon={<Activity className="w-3.5 h-3.5" />}
          label="ML"
          className={t.headerText}
        />
      ),
      cell: (info) => <MlCell value={info.getValue()} />,
    }),

    columnHelper.accessor("protocol", {
      header: () => (
        <ColHeader
          icon={<Radio className="w-3.5 h-3.5" />}
          label="Protocol"
          className={t.headerText}
        />
      ),
      cell: (info) => <ProtocolCell value={info.getValue()} />,
    }),

    columnHelper.accessor("severity", {
      header: () => (
        <ColHeader
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          label="Severity"
          className={t.headerText}
        />
      ),
      cell: (info) => <SeverityCell value={info.getValue()} />,
    }),
  ];
}
