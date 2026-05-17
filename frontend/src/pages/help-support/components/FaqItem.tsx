import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <p className="text-sm font-semibold text-white">{q}</p>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-slate-700">
          <p className="text-sm text-gray-400 mt-3 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}
