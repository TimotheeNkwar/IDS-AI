import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
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
import { ChevronUp, ChevronDown } from "lucide-react";
// Avant

// Après
import { useColumns } from "./components/TrafficColumns";
import TrafficRowDetail from "./components/TrafficRowDetail";
import { Fragment } from "react";
import IPFilterInput from "../../components/IPFilterInput.tsx";
import useAppStore from "../../stores/AppStore.ts";
import useHourDayText from "../../hooks/useHourDayText.ts";
export default function TrafficMonitorPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const HoursDayText = useHourDayText();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const lastUpdate = useWsStore((s) => s.lastUpdate);
  const hours = useAppStore((s) => s.hours);

  const { data, isPending } = useQuery({
    queryKey: ["traffic", hours], // ← re-fetches when hours changes
    queryFn: () => trafficService.fetchTrafficData(hours),
    refetchOnWindowFocus: false,
  });
  // Whenever we receive a new dashboard update via WebSocket, we check if it's an anomaly. If it is, we invalidate the "traffic" query to trigger a refetch and get the latest data. This ensures that our table stays up-to-date with the most recent anomalies.
  useEffect(() => {
    if (lastUpdate?.is_anomaly) {
      queryClient.invalidateQueries({ queryKey: ["traffic", hours] });
    }
  }, [lastUpdate, hours]);

  // explanation may not exist on TrafficRecord; guard access to avoid TS error
  // console.log((data?.data?.traffic?.[0] as any)?.evidence);

  // Merge initial fetch + live WS data (WS en tête)
  const liveAlerts = useWsStore((s) => s.liveAlerts);

  // console.log(liveAlerts);

  const traffic = useMemo(() => {
    const initial = data?.data?.traffic ?? [];

    const live: TrafficRecord[] = liveAlerts.map((alert) => ({
      id: `live-${alert.src_ip}-${alert.dst_ip}-${alert.timestamp}`, // ← stable
      timestamp: alert.timestamp ?? new Date().toISOString(),
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

    // Déduplique — retire les live déjà présents dans initial
    const initialSrcIps = new Set(
      initial.map((t) => `${t.source_ip}-${t.destination_ip}`),
    );
    const dedupedLive = live.filter(
      (l) => !initialSrcIps.has(`${l.source_ip}-${l.destination_ip}`),
    );

    return [...dedupedLive, ...initial];
  }, [data, liveAlerts]);

  const columns = useColumns();

  const table = useReactTable({
    data: traffic,
    columns,
    autoResetPageIndex: false,

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
      <div className="overflow-x-auto rounded-2xl border border-slate-700/50 light:bg-slate-100 bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-black/30">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
          <div>
            <h1 className="text-xl font-semibold text-white light:text-slate-900 ">
              Traffic Monitor
            </h1>
            <p className="text-xs text-slate-400 mt-1 light:text-slate-600">
              Only anomalies from the last {HoursDayText} are displayed. Live
              WebSocket feed.
            </p>
          </div>

          <IPFilterInput
            table={table}
            column="source_ip"
            placeholder="Filter by IP..."
          />
        </div>

        {/* TABLE */}
        <table className="w-full">
          {/* HEADER */}
          <thead className="bg-slate-800/30 border-b border-slate-700/40  backdrop-blur light:bg-white/50 light:border-slate-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-300 cursor-pointer hover:text-white transition"
                  >
                    <div className="flex items-center gap-1 font-medium">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}

                      {{
                        asc: (
                          <ChevronUp className="w-4 h-4 text-fuchsia-400 light:text-violet-700" />
                        ),
                        desc: (
                          <ChevronDown className="w-4 h-4 text-fuchsia-400 light:text-violet-700" />
                        ),
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
                <th />
              </tr>
            ))}
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-slate-800/40">
            {table.getRowModel().rows.map((row) => {
              const isOpen = expandedRow === row.id;

              return (
                <Fragment key={row.id}>
                  {/* ROW */}
                  <tr
                    onClick={() => setExpandedRow(isOpen ? null : row.id)}
                    className={`
                  group cursor-pointer transition
                  hover:bg-slate-800/40 light:hover:bg-slate-200
                  ${isOpen ? "bg-fuchsia-500/5" : ""}
                `}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm text-slate-200 group-hover:text-white transition"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}

                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-fuchsia-400 light:text-violet-700" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-white light:text-slate-600 light:group-hover:text-slate-900" />
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* EXPANDED */}
                  {isOpen && (
                    <tr className="bg-slate-900/30 light:bg-white/50">
                      <td colSpan={columns.length + 1} className="p-0">
                        <div className="border-l-2 border-fuchsia-500/40 pl-4 py-3 backdrop-blur">
                          <TrafficRowDetail row={row.original} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>

        {/* EMPTY STATE */}
        {traffic.length === 0 && (
          <div className="py-10 text-center text-slate-500 text-sm">
            No traffic data available for the last {HoursDayText}.
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
        <span>{traffic.length} entries</span>
        <span>live via WebSocket</span>
      </div>

      <TablePagination table={table} />
    </div>
  );
}
