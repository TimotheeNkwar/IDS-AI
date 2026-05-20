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
import type { Alert } from "../../../types/types";
import { useThemeStore } from "../../../stores/themeStore";
import { formatDate } from "../../../lib/utils";

const columnHelper = createColumnHelper<Alert>();

// ── Tokens ────────────────────────────────────────────────────────────────────
function useTokens() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return {
    headerText: isDark ? "text-slate-400" : "text-slate-500",
    cellText: isDark ? "text-slate-200" : "text-slate-800",
    cellMuted: isDark ? "text-slate-300" : "text-slate-600",
    badgeType: isDark
      ? "bg-red-500/10 text-red-300 border-red-500/20"
      : "bg-red-50    text-red-600  border-red-200",
    barTrack: isDark ? "bg-slate-800" : "bg-slate-200",
    badgeProtocol: isDark
      ? "bg-slate-800/40 border-slate-700/40 text-slate-300"
      : "bg-slate-100    border-slate-200     text-slate-600",
    severity: {
      high: isDark
        ? "bg-red-500/10    text-red-300    border-red-500/20"
        : "bg-red-50        text-red-600    border-red-200",
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

// ── Header réutilisable ───────────────────────────────────────────────────────
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

// ── Cell components ───────────────────────────────────────────────────────────
function TimestampCell({ value }: { value: string }) {
  const t = useTokens();
  return (
    <span className={`text-sm font-mono ${t.cellText}`}>
      {formatDate(value)}
    </span>
  );
}

function TypeCell({ value }: { value: string }) {
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
          className="h-full bg-fuchsia-500 rounded-full"
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

    columnHelper.accessor("type", {
      header: () => (
        <ColHeader
          icon={<Shield className="w-3.5 h-3.5" />}
          label="Type"
          className={t.headerText}
        />
      ),
      cell: (info) => <TypeCell value={info.getValue()} />,
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
