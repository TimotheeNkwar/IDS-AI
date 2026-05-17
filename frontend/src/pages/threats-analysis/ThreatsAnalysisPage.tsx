import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { columns } from "./components/ThreatsColumn";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { alertService } from "../../services/alertService";
import { Fragment, useMemo, useRef, useState } from "react";
import type { Alert } from "../../types/types";
import { useAlert, useAlerts } from "../../hooks/useAlerts";
import TablePagination from "../../components/TablePagination.tsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import ThreatModal from "./components/ThreatModal.tsx";
import IPFilterInput from "../../components/IPFilterInput.tsx";

export default function ThreatsAnalysisPage() {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openModal = (alert: Alert) => {
    setSelectedAlert(alert);
    dialogRef.current?.showModal();
  };

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const { data: alerts } = useAlerts();

  const table = useReactTable({
    data: alerts?.alerts ?? [],
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

  return (
    <div className="space-y-4">
      {/* MAIN CONTAINER */}
      <div
        className="
        overflow-hidden
        rounded-2xl
        border border-slate-700/50
        bg-slate-900/40
        backdrop-blur-xl
        shadow-xl shadow-black/30
      "
      >
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">
                Threats Analysis
              </h1>
              <p className="text-xs text-slate-400 mt-1">
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
            <thead className="bg-slate-800/30 border-b border-slate-700/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="
                        px-4 py-3
                        text-left text-xs uppercase tracking-wider
                        text-slate-300
                        cursor-pointer
                        hover:text-white
                        transition
                      "
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}

                        {{
                          asc: (
                            <ChevronUp className="w-4 h-4 text-fuchsia-400" />
                          ),
                          desc: (
                            <ChevronDown className="w-4 h-4 text-fuchsia-400" />
                          ),
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* TBODY */}
            <tbody className="divide-y divide-slate-800/40">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => openModal(row.original)}
                  className="
                    cursor-pointer
                    hover:bg-slate-800/30
                    transition
                    group
                  "
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="
                        px-4 py-3
                        text-sm text-slate-200
                        group-hover:text-white
                        transition
                      "
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
            <div className="text-center py-10 text-slate-500 text-sm">
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
