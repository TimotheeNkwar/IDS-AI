import { Clock, Sparkles, Timer } from "lucide-react";
import { useState } from "react";

export default function Hours() {
  const [hours, setHours] = useState(24);

  const HOURS_PRESETS = [1, 6, 12, 24, 48, 72, 168, 720];

  const format = (h: number) => {
    if (h >= 168) return `${Math.round(h / 168)}w`;
    if (h >= 24) return `${Math.round(h / 24)}d`;
    return `${h}h`;
  };
  return (
    <div
      className="
        relative overflow-hidden
        rounded-3xl border border-slate-700/60
        bg-slate-900/70 backdrop-blur-xl
        p-6
      "
    >
      {/* Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-fuchsia-500/10 blur-3xl rounded-full"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full"></div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-4 h-4 text-fuchsia-400" />

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Time Range
            </p>
            <h2 className="text-xl font-bold text-white">
              Default Time Window
            </h2>
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Controls how much historical network data is analyzed and displayed
          across dashboards and threat views.
        </p>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-6">
          {HOURS_PRESETS.map((h) => {
            const active = hours === h;

            return (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`
                  px-3 py-1.5 rounded-xl
                  text-sm font-medium
                  border transition-all duration-300
                  ${
                    active
                      ? "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300 shadow-md shadow-fuchsia-500/10"
                      : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600 hover:-translate-y-0.5"
                  }
                `}
              >
                {format(h)}
              </button>
            );
          })}
        </div>

        {/* Slider */}
        <div
          className="
            rounded-2xl border border-slate-700/60
            bg-slate-800/40
            p-4
          "
        >
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-slate-400 flex items-center gap-2">
              <Timer className="w-4 h-4 text-slate-500" />
              Custom range
            </label>

            <div className="text-sm font-semibold text-white">
              {hours}h{" "}
              <span className="text-slate-500 font-normal">
                ({format(hours)})
              </span>
            </div>
          </div>

          <input
            type="range"
            min={1}
            max={720}
            step={1}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="
              w-full accent-fuchsia-500
              cursor-pointer
            "
          />

          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>1h</span>
            <span>1w</span>
            <span>30d</span>
          </div>
        </div>
      </div>
    </div>
  );
}
