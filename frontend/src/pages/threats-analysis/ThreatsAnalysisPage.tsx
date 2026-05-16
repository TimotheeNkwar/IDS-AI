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
  const { data: alerts, error, isPending } = useAlerts();

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
    <div>
      <div className="overflow-x-auto  rounded-xlborder border-base-content/5 bg-slate-900 py-4 rounded-4xl">
        <div className="px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 mb-4">
              <h1 className="text-xl font-medium ">Threats Analysis</h1>
            </div>
            <IPFilterInput
              table={table}
              column="source_ip"
              placeholder="Filter by IP..."
            />
          </div>
          <div>
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
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <tr
                      className="hover cursor-pointer"
                      onClick={() => openModal(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
            {alerts?.alerts.length === 0 && (
              <p className="text-center py-8 text-base-content/50">
                No data available
              </p>
            )}
            <div className="flex items-center justify-end mt-4">
              <ThreatModal ref={dialogRef} alert={selectedAlert} />
            </div>
          </div>
        </div>
      </div>
      <TablePagination table={table} />
    </div>
  );
}
