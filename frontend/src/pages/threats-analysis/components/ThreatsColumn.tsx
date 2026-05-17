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

const columnHelper = createColumnHelper<Alert>();

export const columns = [
  columnHelper.accessor("timestamp", {
    header: () => (
      <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider">
        <Clock className="w-3.5 h-3.5" />
        Time
      </div>
    ),
    cell: (info) => (
      <span className="text-slate-200 text-sm font-mono">
        {new Date(info.getValue()).toLocaleTimeString()}
      </span>
    ),
  }),

  columnHelper.accessor("type", {
    header: () => (
      <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider">
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

  columnHelper.accessor("source_ip", {
    header: () => (
      <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider">
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

  columnHelper.accessor("destination_ip", {
    header: () => (
      <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider">
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

  columnHelper.accessor("ml_confidence", {
    header: () => (
      <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider">
        <Activity className="w-3.5 h-3.5" />
        ML
      </div>
    ),
    cell: (info) => {
      const v = info.getValue() * 100;

      return (
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-fuchsia-500 rounded-full"
              style={{ width: `${v}%` }}
            />
          </div>
          <span className="text-xs text-slate-300 font-mono">
            {v.toFixed(1)}%
          </span>
        </div>
      );
    },
  }),

  columnHelper.accessor("protocol", {
    header: () => (
      <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider">
        <Radio className="w-3.5 h-3.5" />
        Protocol
      </div>
    ),
    cell: (info) => (
      <span className="text-xs font-mono text-slate-300 bg-slate-800/40 px-2 py-0.5 rounded-md border border-slate-700/40">
        {info.getValue()}
      </span>
    ),
  }),

  columnHelper.accessor("severity", {
    header: () => (
      <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider">
        <AlertTriangle className="w-3.5 h-3.5" />
        Severity
      </div>
    ),
    cell: (info) => {
      const value = info.getValue();

      const styles: Record<string, string> = {
        high: "bg-red-500/10 text-red-300 border-red-500/20",
        medium: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
        low: "bg-green-500/10 text-green-300 border-green-500/20",
      };

      return (
        <span
          className={`
            px-2 py-0.5 rounded-full text-[11px] font-semibold border
            ${styles[value] ?? "bg-slate-800 text-slate-300 border-slate-700"}
          `}
        >
          {value}s
        </span>
      );
    },
  }),
];
