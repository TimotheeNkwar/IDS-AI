export default function TrafficDataLoader() {
  return (
    <div
      className="
        relative overflow-hidden
        overflow-x-auto
        rounded-3xl
        border border-slate-800/60
        light:border-slate-200
        bg-slate-900/50
        light:bg-white/70
        backdrop-blur-2xl
        shadow-[0_8px_40px_rgba(0,0,0,0.35)]
      "
    >
      {/* Ambient glow */}
      <div className="absolute -top-16 -right-16 w-52 h-52 bg-fuchsia-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* HEADER */}
      <div className="relative px-6 py-5 border-b border-slate-800/50 light:border-slate-200/70">
        <div className="h-5 w-40 bg-slate-700/40 light:bg-slate-200 rounded-md animate-pulse mb-2" />

        <div className="h-3 w-72 bg-slate-700/30 light:bg-slate-200/80 rounded-md animate-pulse" />
      </div>

      <table className="relative w-full border-separate border-spacing-0">
        <thead className="bg-slate-800/30 light:bg-slate-100/70">
          <tr>
            {Array.from({ length: 8 }).map((_, i) => (
              <th
                key={i}
                className="
                  px-4 py-4
                  border-b border-slate-800/40
                  light:border-slate-200
                "
              >
                <div className="h-3 w-20 bg-slate-700/30 light:bg-slate-300 rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: 6 }).map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className="
                group
                border-b border-slate-800/30
                light:border-slate-200/60
                hover:bg-white/[0.02]
                light:hover:bg-slate-100/50
                transition-all duration-300
              "
            >
              {/* checkbox */}
              <td className="px-4 py-4">
                <div className="h-4 w-4 rounded bg-slate-700/40 light:bg-slate-300 animate-pulse" />
              </td>

              {/* time */}
              <td className="px-4 py-4">
                <div className="h-3 w-24 rounded bg-slate-700/30 light:bg-slate-300 animate-pulse" />
              </td>

              {/* type */}
              <td className="px-4 py-4">
                <div className="h-5 w-20 rounded-full bg-red-500/20 light:bg-red-200 animate-pulse" />
              </td>

              {/* source ip */}
              <td className="px-4 py-4">
                <div className="h-3 w-32 rounded bg-slate-700/30 light:bg-slate-300 animate-pulse" />
              </td>

              {/* destination ip */}
              <td className="px-4 py-4">
                <div className="h-3 w-32 rounded bg-slate-700/30 light:bg-slate-300 animate-pulse" />
              </td>

              {/* confidence */}
              <td className="px-4 py-4">
                <div className="h-3 w-16 rounded bg-fuchsia-500/20 light:bg-fuchsia-200 animate-pulse" />
              </td>

              {/* protocol */}
              <td className="px-4 py-4">
                <div className="h-3 w-14 rounded bg-cyan-500/20 light:bg-cyan-200 animate-pulse" />
              </td>

              {/* severity */}
              <td className="px-4 py-4">
                <div className="h-5 w-20 rounded-full bg-yellow-500/20 light:bg-yellow-200 animate-pulse" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer shimmer */}
      <div className="px-6 py-4 border-t border-slate-800/40 light:border-slate-200/70">
        <div className="h-3 w-44 bg-slate-700/30 light:bg-slate-300 rounded animate-pulse" />
      </div>
    </div>
  );
}
