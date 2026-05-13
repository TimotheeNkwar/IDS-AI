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
    <div className="flex items-center justify-between mt-4 px-2">
      <div className="join">
        <button
          className="join-item btn btn-sm bg-slate-900"
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
        >
          «
        </button>
        <button
          className="join-item btn btn-sm bg-slate-900"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          ‹
        </button>

        {pages.map((item, idx) =>
          item === "..." ? (
            <button
              key={`ellipsis-${idx}`}
              className="join-item btn btn-sm btn-disabled"
            >
              ...
            </button>
          ) : (
            <button
              key={item}
              className={`join-item btn btn-sm ${currentPage === item ? "bg-fuchsia-600 border-fuchsia-600 text-white" : ""}`}
              onClick={() => table.setPageIndex(item as number)}
            >
              {(item as number) + 1}
            </button>
          ),
        )}

        <button
          className="join-item btn btn-sm bg-slate-900"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          ›
        </button>
        <button
          className="join-item btn btn-sm bg-slate-900"
          onClick={() => table.lastPage()}
          disabled={!table.getCanNextPage()}
        >
          »
        </button>
      </div>

      <select
        className="select select-sm select-bordered"
        value={table.getState().pagination.pageSize}
        onChange={(e) => table.setPageSize(Number(e.target.value))}
      >
        {[10, 20, 50].map((size) => (
          <option key={size} value={size}>
            {size} / page
          </option>
        ))}
      </select>
    </div>
  );
}
