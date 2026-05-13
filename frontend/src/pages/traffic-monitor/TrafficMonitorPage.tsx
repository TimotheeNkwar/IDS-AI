import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { useWsStore } from "../../stores/wsStore";
import { trafficService } from "../../services/trafficService";
import type { TrafficRecord } from "../../types/types";
import { useState, useMemo } from "react";
import TrafficDataLoader from "../../components/TrafficDataLoader";
import type { SortingState, ColumnFiltersState } from "@tanstack/react-table";
import TablePagination from "../../components/TablePagination.tsx";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  Clock,
  Shield,
  MonitorSmartphone,
  Network,
  Activity,
  Radio,
  AlertTriangle,
  Search,
} from "lucide-react";
import { columns } from "./components/TrafficColumns";
import TrafficRowDetail from "./components/TrafficRowDetail";
import { Fragment } from "react";

const columnHelper = createColumnHelper<TrafficRecord>();

const SEVERITY_BADGE: Record<string, string> = {
  high: "badge badge-error",
  medium: "badge badge-warning",
  low: "badge badge-success",
};

export default function TrafficMonitorPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const lastUpdate = useWsStore((s) => s.lastUpdate);
  const liveTraffic = useWsStore((s) => s.liveTraffic);

  const { data, isPending } = useQuery({
    queryKey: ["traffic"],
    queryFn: () => trafficService.fetchTrafficData(),
    refetchOnWindowFocus: false,
  });

  // Whenever we receive a new dashboard update via WebSocket, we check if it's an anomaly. If it is, we invalidate the "traffic" query to trigger a refetch and get the latest data. This ensures that our table stays up-to-date with the most recent anomalies.
  useEffect(() => {
    if (lastUpdate?.is_anomaly) {
      queryClient.invalidateQueries({ queryKey: ["traffic"] });
    }
  }, [lastUpdate]);

  // explanation may not exist on TrafficRecord; guard access to avoid TS error
  // console.log((data?.data?.traffic?.[0] as any)?.evidence);

  // Merge initial fetch + live WS data (WS en tête)
  const liveAlerts = useWsStore((s) => s.liveAlerts);

  // console.log(liveAlerts);

  const traffic = useMemo(() => {
    const initial = data?.data?.traffic ?? [];
    // Convertit liveAlerts en TrafficRecord
    const live: TrafficRecord[] = liveAlerts.map((alert) => ({
      id: `${alert.src_ip}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source_ip: alert.src_ip,
      destination_ip: alert.dst_ip,
      protocol: alert.protocol,
      service: alert.service,
      packet_size: 0,
      duration: 0,
      label: alert.attack_type ?? alert.ml_label,
      is_anomaly: true,
      ml_confidence: alert.ml_confidence,
      severity: alert.severity as "low" | "medium" | "high",
      risk_signals: alert.risk_signals,
      top_features: alert.top_features,
      knowledge_matches: alert.knowledge_matches,
      explanation: alert.explanation,
      recommended_action: alert.recommended_action,
      classification: alert.classification,
      needs_review: alert.needs_review,
      ml_model: alert.ml_model,
      llm_severity: alert.llm_severity ?? undefined,
      llm_confidence: alert.llm_confidence,
      final_confidence: alert.confidence,
    }));

    return [...live, ...initial];
  }, [data, liveAlerts]);

  const table = useReactTable({
    data: traffic,
    columns,

    state: {
      sorting,
      columnFilters,
      pagination,
    },

    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isPending) return <TrafficDataLoader />;

  return (
    <div>
      <div className="overflow-x-auto  rounded-xlborder border-base-content/5 bg-slate-900 py-4 rounded-4xl">
        <div className="flex items-center justify-between mb-4 px-8">
          <div>
            <h1 className="text-xl font-medium">Traffic Monitor</h1>
            <p className="text-xs text-base-content/40">
              Only anomalies from the last 24h are displayed. Data is updated
              live via WebSocket.
            </p>
          </div>
          <div className="relative">
            {/* <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-base-content/40 pointer-events-none" /> */}
            <div>
              <label className="input input-sm input-bordered rounded-full flex items-center gap-2 w-64 ">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4 opacity-70"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.965 11.026a5.5 5.5 0 1 1 1.06-1.06l3.754 3.754a.75.75 0 1 1-1.06 1.06l-3.754-3.754ZM11 6.5a4.5 4.5 0 1 1-9 0a4.5 4.5 0 0 1 9 0Z"
                    clipRule="evenodd"
                  />
                </svg>

                <input
                  type="text"
                  className="grow"
                  placeholder="Filter by IP..."
                  onChange={(e) =>
                    table.getColumn("source_ip")?.setFilterValue(e.target.value)
                  }
                />
              </label>
            </div>
          </div>
        </div>
        <table className="table">
          <thead className="bg-slate-800/50 text-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer select-none"
                  >
                    <div className="flex items-center font-semibold gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {{
                        asc: <ChevronUp className="w-4 h-4" />,
                        desc: <ChevronDown className="w-4 h-4" />,
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
                <th />
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <tr
                  className="hover cursor-pointer"
                  onClick={() =>
                    setExpandedRow(expandedRow === row.id ? null : row.id)
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                  <td>
                    {expandedRow === row.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </td>
                </tr>

                {expandedRow === row.id && (
                  <tr className="bg-slate-800/30 accordion-row">
                    <td colSpan={columns.length + 1} className="p-0">
                      <TrafficRowDetail row={row.original} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>

        {traffic.length === 0 && (
          <p className="text-center py-8 text-base-content/50">
            No data available
          </p>
        )}
      </div>

      <TablePagination table={table} />

      <p className="text-xs text-base-content/40 mt-2">
        {traffic.length} entries — live via WebSocket
      </p>
    </div>
  );
}
