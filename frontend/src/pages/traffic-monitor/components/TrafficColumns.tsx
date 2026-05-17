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

const columnHelper = createColumnHelper<TrafficRecord>();

export const columns = [

  // TIME
  columnHelper.accessor("timestamp", {
    header: () => (
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
        <Clock className="w-3.5 h-3.5" />
        Time
      </div>
    ),
    cell: (info) => (
      <span className="text-slate-200 font-mono text-sm">
        {formatDate(info.getValue())}
      </span>
    ),
  }),

  // TYPE
  columnHelper.accessor("label", {
    header: () => (
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
        <Shield className="w-3.5 h-3.5" />
        Type
      </div>
    ),
    cell: (info) => (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-300 border border-red-500/20">
        {info.getValue()}
      </span>
    ),
  }),

  // SOURCE IP
  columnHelper.accessor("source_ip", {
    header: () => (
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
        <MonitorSmartphone className="w-3.5 h-3.5" />
        Source
      </div>
    ),
    cell: (info) => (
      <span className="font-mono text-sm text-slate-200">
        {info.getValue()}
      </span>
    ),
  }),

  // DEST IP
  columnHelper.accessor("destination_ip", {
    header: () => (
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
        <Network className="w-3.5 h-3.5" />
        Destination
      </div>
    ),
    cell: (info) => (
      <span className="font-mono text-sm text-slate-200">
        {info.getValue()}
      </span>
    ),
  }),

  // ML CONFIDENCE
  columnHelper.accessor("ml_confidence", {
    header: () => (
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
        <Activity className="w-3.5 h-3.5" />
        ML
      </div>
    ),
    cell: (info) => {
      const value = info.getValue() * 100;

      return (
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-fuchsia-500 rounded-full"
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-300">
            {value.toFixed(1)}%
          </span>
        </div>
      );
    },
  }),

  // PROTOCOL
  columnHelper.accessor("protocol", {
    header: () => (
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
        <Radio className="w-3.5 h-3.5" />
        Protocol
      </div>
    ),
    cell: (info) => (
      <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800/40 border border-slate-700/40 text-slate-300">
        {info.getValue()}
      </span>
    ),
  }),

  // SEVERITY
  columnHelper.accessor("severity", {
    header: () => (
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
        <AlertTriangle className="w-3.5 h-3.5" />
        Severity
      </div>
    ),
    cell: (info) => {
      const v = info.getValue();

      const styles: Record<string, string> = {
        high: "bg-red-500/10 text-red-300 border-red-500/20",
        medium: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
        low: "bg-green-500/10 text-green-300 border-green-500/20",
      };

      return (
        <span
          className={`
            px-2 py-0.5 rounded-full text-[11px] font-semibold border
            ${styles[v] ?? "bg-slate-800 text-slate-300 border-slate-700"}
          `}
        >
          {v}
        </span>
      );
    },
  }),
];