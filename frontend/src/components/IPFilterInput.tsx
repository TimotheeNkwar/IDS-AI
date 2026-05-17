import { Search } from "lucide-react";
import type { Table } from "@tanstack/react-table";

type Props<T> = {
  table: Table<T>;
  column: string;
  placeholder?: string;
};

export default function IPFilterInput<T>({
  table,
  column,
  placeholder = "Filter...",
}: Props<T>) {
  return (
    <label
      className="
      flex items-center gap-2
      w-64 px-3 py-2
      rounded-full
      bg-slate-900/40
      backdrop-blur-xl
      border border-slate-700/50
      shadow-md shadow-black/20
      text-slate-200
      transition
      focus-within:border-fuchsia-500/40
      focus-within:bg-slate-900/60
    "
    >
      <Search className="h-4 w-4 text-slate-400" />

      <input
        type="text"
        className="
          w-full bg-transparent
          outline-none
          text-sm text-slate-200
          placeholder:text-slate-500
        "
        placeholder={placeholder}
        onChange={(e) =>
          table.getColumn(column)?.setFilterValue(e.target.value)
        }
      />
    </label>
  );
}
