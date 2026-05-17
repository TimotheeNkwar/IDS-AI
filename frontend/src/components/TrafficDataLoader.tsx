export default function TrafficDataLoader() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-black/20">
      {/* HEADER (fake table header feel) */}
      <div className="px-6 py-4 border-b border-slate-800/50">
        <div className="h-5 w-40 bg-slate-700/40 rounded-md animate-pulse mb-2" />
        <div className="h-3 w-72 bg-slate-700/30 rounded-md animate-pulse" />
      </div>

      <table className="w-full">
        <thead className="bg-slate-800/30">
          <tr>
            {Array.from({ length: 8 }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-3 w-20 bg-slate-700/30 rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-800/40">
          {Array.from({ length: 6 }).map((_, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-800/20 transition">
              {/* checkbox column */}
              <td className="px-4 py-3">
                <div className="h-4 w-4 bg-slate-700/40 rounded animate-pulse" />
              </td>

              {/* other columns */}
              <td className="px-4 py-3">
                <div className="h-3 w-24 bg-slate-700/30 rounded animate-pulse" />
              </td>

              <td className="px-4 py-3">
                <div className="h-3 w-20 bg-slate-700/30 rounded animate-pulse" />
              </td>

              <td className="px-4 py-3">
                <div className="h-3 w-32 bg-slate-700/30 rounded animate-pulse" />
              </td>

              <td className="px-4 py-3">
                <div className="h-3 w-32 bg-slate-700/30 rounded animate-pulse" />
              </td>

              <td className="px-4 py-3">
                <div className="h-3 w-16 bg-slate-700/30 rounded animate-pulse" />
              </td>

              <td className="px-4 py-3">
                <div className="h-3 w-14 bg-slate-700/30 rounded animate-pulse" />
              </td>

              <td className="px-4 py-3">
                <div className="h-3 w-20 bg-slate-700/30 rounded animate-pulse" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
