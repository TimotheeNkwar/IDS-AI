import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { useColumns } from "./components/ThreatsColumn";
import { useState, useRef } from "react";
import type { Alert } from "../../types/types";
import { useAlerts } from "../../hooks/useAlerts";
import TablePagination from "../../components/TablePagination.tsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import ThreatModal from "./components/ThreatModal.tsx";
import IPFilterInput from "../../components/IPFilterInput.tsx";
import { useThemeStore } from "../../stores/themeStore";
import useAppStore from "../../stores/AppStore.ts";

export default function ThreatsAnalysisPage() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  // ── Tokens ─────────────────────────────────────────────────────────────────
  const t = {
    container: isDark
      ? "border-slate-700/50 bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-black/30"
      : "border-slate-200 bg-white shadow-sm",
    headerBorder: isDark ? "border-slate-800/50" : "border-slate-200",
    title: isDark ? "text-white" : "text-slate-900",
    subtitle: isDark ? "text-slate-400" : "text-slate-500",
    thead: isDark
      ? "bg-slate-800/30 border-slate-700/40"
      : "bg-slate-50 border-slate-200",
    th: isDark
      ? "text-slate-300 hover:text-white"
      : "text-slate-500 hover:text-slate-900",
    sortIcon: "text-fuchsia-400",
    rowDivide: isDark ? "divide-slate-800/40" : "divide-slate-100",
    rowHover: isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50",
    td: isDark
      ? "text-slate-200 group-hover:text-white"
      : "text-slate-700 group-hover:text-slate-900",
    empty: isDark ? "text-slate-500" : "text-slate-400",
  };

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openModal = (alert: Alert) => {
    setSelectedAlert(alert);
    dialogRef.current?.showModal();
  };

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { hours } = useAppStore();
  const { data: alerts } = useAlerts({ hours });
  const columns = useColumns();

  const table = useReactTable({
    data: alerts?.alerts ?? [],
    columns,
    autoResetPageIndex: false,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* MAIN CONTAINER */}
      <div className={`overflow-hidden rounded-2xl border ${t.container}`}>
        {/* HEADER */}
        <div className={`px-6 py-4 border-b ${t.headerBorder}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-xl font-semibold ${t.title}`}>
                Threats Analysis
              </h1>
              <p className={`text-xs mt-1 ${t.subtitle}`}>
                Real-time ML + LLM threat detection stream
              </p>
            </div>
            <IPFilterInput
              table={table}
              column="source_ip"
              placeholder="Filter by IP..."
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* THEAD */}
            <thead className={`border-b ${t.thead}`}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={`px-4 py-3 text-left text-xs uppercase tracking-wider cursor-pointer transition ${t.th}`}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: (
                            <ChevronUp className={`w-4 h-4 ${t.sortIcon}`} />
                          ),
                          desc: (
                            <ChevronDown className={`w-4 h-4 ${t.sortIcon}`} />
                          ),
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* TBODY */}
            <tbody className={`divide-y ${t.rowDivide}`}>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => openModal(row.original)}
                  className={`cursor-pointer transition group ${t.rowHover}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-4 py-3 text-sm transition ${t.td}`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* EMPTY STATE */}
          {alerts?.alerts.length === 0 && (
            <div className={`text-center py-10 text-sm ${t.empty}`}>
              No data available
            </div>
          )}
        </div>
      </div>

      {/* MODAL + PAGINATION */}
      <div className="flex items-center justify-end">
        <ThreatModal ref={dialogRef} alert={selectedAlert} />
      </div>

      <TablePagination table={table} />
    </div>
  );
}
