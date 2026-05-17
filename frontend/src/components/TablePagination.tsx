import type { Table } from "@tanstack/react-table";

interface Props<T> {
  table: Table<T>;
}

export default function TablePagination<T>({ table }: Props<T>) {
  const currentPage = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  const pages = Array.from({ length: pageCount }, (_, i) => i)
    .filter(
      (i) => i === 0 || i === pageCount - 1 || Math.abs(i - currentPage) <= 1,
    )
    .reduce<(number | "...")[]>((acc, page, idx, arr) => {
      if (idx > 0 && (page as number) - (arr[idx - 1] as number) > 1) {
        acc.push("...");
      }
      acc.push(page);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between mt-4 px-2 text-sm text-slate-300">
      {/* LEFT CONTROLS */}
      <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 rounded-xl px-2 py-1 backdrop-blur">
        <button
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-2 py-1 rounded-md hover:bg-slate-800 disabled:opacity-40 transition"
        >
          «
        </button>

        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-2 py-1 rounded-md hover:bg-slate-800 disabled:opacity-40 transition"
        >
          ‹
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        {/* PAGE NUMBERS */}
        {pages.map((item, idx) =>
          item === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-500">
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => table.setPageIndex(item as number)}
              className={`
                px-3 py-1 rounded-md transition
                hover:bg-slate-800
                ${
                  currentPage === item
                    ? "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30"
                    : "text-slate-300"
                }
              `}
            >
              {(item as number) + 1}
            </button>
          ),
        )}

        <div className="h-4 w-px bg-slate-700 mx-1" />

        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-2 py-1 rounded-md hover:bg-slate-800 disabled:opacity-40 transition"
        >
          ›
        </button>

        <button
          onClick={() => table.lastPage()}
          disabled={!table.getCanNextPage()}
          className="px-2 py-1 rounded-md hover:bg-slate-800 disabled:opacity-40 transition"
        >
          »
        </button>
      </div>

      {/* RIGHT: page size (clean chip style instead of select) */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span>Rows</span>

        <select
          className="bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 outline-none"
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
        >
          {[10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
