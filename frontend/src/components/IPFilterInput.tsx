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
    <label className="input input-sm input-bordered rounded-full flex items-center gap-2 w-64">
      <Search className="h-4 w-4 opacity-70" />

      <input
        type="text"
        className="grow"
        placeholder={placeholder}
        onChange={(e) =>
          table.getColumn(column)?.setFilterValue(e.target.value)
        }
      />
    </label>
  );
}
