// components/TrafficColumns.tsx
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

export const SEVERITY_BADGE: Record<string, string> = {
  high: "badge badge-error",
  medium: "badge badge-warning",
  low: "badge badge-success",
};

export const columns = [
  columnHelper.accessor("timestamp", {
    header: () => (
      <div className="flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" /> Time
      </div>
    ),
    cell: (info) => new Date(info.getValue()).toLocaleTimeString(),
  }),
  columnHelper.accessor("type", {
    header: () => (
      <div className="flex items-center gap-1">
        <Shield className="w-3.5 h-3.5" /> Type
      </div>
    ),
    cell: (info) => (
      <span className="badge badge-outline uppercase bg-red-100 text-red-800 font-bold">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("source_ip", {
    header: () => (
      <div className="flex items-center gap-1">
        <MonitorSmartphone className="w-3.5 h-3.5" /> Source IP
      </div>
    ),
  }),
  columnHelper.accessor("destination_ip", {
    header: () => (
      <div className="flex items-center gap-1">
        <Network className="w-3.5 h-3.5" /> Destination IP
      </div>
    ),
  }),
  columnHelper.accessor("ml_confidence", {
    header: () => (
      <div className="flex items-center gap-1">
        <Activity className="w-3.5 h-3.5" /> ML Confidence
      </div>
    ),
    cell: (info) => `${(info.getValue() * 100).toFixed(1)}%`,
  }),
  columnHelper.accessor("protocol", {
    header: () => (
      <div className="flex items-center gap-1">
        <Radio className="w-3.5 h-3.5" /> Protocol
      </div>
    ),
    cell: (info) => (
      <span className="font-mono text-sm">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("severity", {
    header: () => (
      <div className="flex items-center gap-1">
        <AlertTriangle className="w-3.5 h-3.5" /> Severity
      </div>
    ),
    cell: (info) => (
      <span className={SEVERITY_BADGE[info.getValue()] ?? "badge"}>
        {info.getValue()}
      </span>
    ),
  }),
];
