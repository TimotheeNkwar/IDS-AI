import type { Table } from "@tanstack/react-table";
import { useThemeStore } from "../stores/themeStore.ts";

interface Props<T> {
  table: Table<T>;
}

export default function TablePagination<T>({ table }: Props<T>) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

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

  // ── Tokens ──────────────────────────────────────────────────────────────────
  const t = {
    wrapper: isDark ? "text-slate-300" : "text-slate-700",
    controls: isDark
      ? "bg-slate-900/60 border-slate-800"
      : "bg-white border-slate-200",
    btn: isDark ? "hover:bg-slate-800" : "hover:bg-slate-100",
    divider: isDark ? "bg-slate-700" : "bg-slate-200",
    pageIdle: isDark ? "text-slate-300" : "text-slate-700",
    pageActive: isDark
      ? "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30"
      : "bg-violet-50      text-violet-700  border border-violet-200",
    ellipsis: isDark ? "text-slate-500" : "text-slate-400",
    selectLabel: isDark ? "text-slate-400" : "text-slate-500",
    select: isDark
      ? "bg-slate-900/60 border-slate-800 text-slate-300"
      : "bg-white border-slate-200 text-slate-700",
  };

  return (
    <div
      className={`flex items-center justify-between mt-4 px-2 text-sm ${t.wrapper}`}
    >
      {/* LEFT CONTROLS */}
      <div
        className={`flex items-center gap-1 border rounded-xl px-2 py-1 backdrop-blur ${t.controls}`}
      >
        <button
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
          className={`px-2 py-1 rounded-md disabled:opacity-40 transition ${t.btn}`}
        >
          «
        </button>

        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className={`px-2 py-1 rounded-md disabled:opacity-40 transition ${t.btn}`}
        >
          ‹
        </button>

        <div className={`h-4 w-px mx-1 ${t.divider}`} />

        {/* PAGE NUMBERS */}
        {pages.map((item, idx) =>
          item === "..." ? (
            <span key={`ellipsis-${idx}`} className={`px-2 ${t.ellipsis}`}>
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => table.setPageIndex(item as number)}
              className={`px-3 py-1 rounded-md transition ${t.btn} ${
                currentPage === item ? t.pageActive : t.pageIdle
              }`}
            >
              {(item as number) + 1}
            </button>
          ),
        )}

        <div className={`h-4 w-px mx-1 ${t.divider}`} />

        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className={`px-2 py-1 rounded-md disabled:opacity-40 transition ${t.btn}`}
        >
          ›
        </button>

        <button
          onClick={() => table.lastPage()}
          disabled={!table.getCanNextPage()}
          className={`px-2 py-1 rounded-md disabled:opacity-40 transition ${t.btn}`}
        >
          »
        </button>
      </div>

      {/* RIGHT: rows per page */}
      <div className={`flex items-center gap-2 text-xs ${t.selectLabel}`}>
        <span>Rows</span>
        <select
          className={`border rounded-lg px-2 py-1 outline-none ${t.select}`}
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
