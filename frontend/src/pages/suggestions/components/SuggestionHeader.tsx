import { ShieldAlert, Filter, Sparkles, ChevronDown } from "lucide-react";

interface Props {
  priority: string;
  type: string;
  onPriorityChange: (v: string) => void;
  onTypeChange: (v: string) => void;
}

export default function SuggestionHeader({
  priority,
  type,
  onPriorityChange,
  onTypeChange,
}: Props) {
  return (
    <div
      className="
        relative overflow-hidden
        rounded-3xl border border-slate-700/60
        bg-slate-900/70 backdrop-blur-xl
        p-6 mb-6
      "
    >
      {/* Glow Effects */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-fuchsia-500/10 blur-3xl rounded-full"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full"></div>

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Content */}
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="
                w-10 h-10 rounded-2xl
                flex items-center justify-center
                bg-gradient-to-br from-red-500/20 to-red-700/10
                border border-red-500/20
                text-red-300
              "
            >
              <ShieldAlert className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-1 text-fuchsia-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />

                <span className="uppercase tracking-[0.2em] text-[10px] font-semibold">
                  Threat Intelligence
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Security Suggestions
              </h1>
            </div>
          </div>

          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            Recommendations generated from recent network traffic, anomaly
            detection, and suspicious behavioral patterns identified by your IDS
            engine.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
          {/* Priority */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Priority
            </label>

            <div className="relative">
              <select
                className="
                  appearance-none
                  w-full sm:w-44 h-11
                  rounded-2xl
                  border border-slate-700
                  bg-slate-800/70
                  px-4 pr-10
                  text-sm text-white
                  outline-none
                  transition-all
                  focus:border-fuchsia-500
                  focus:ring-2 focus:ring-fuchsia-500/20
                "
                value={priority}
                onChange={(e) => onPriorityChange(e.target.value)}
              >
                <option value="">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Threat Type
            </label>

            <div className="relative">
              <select
                className="
                  appearance-none
                  w-full sm:w-44 h-11
                  rounded-2xl
                  border border-slate-700
                  bg-slate-800/70
                  px-4 pr-10
                  text-sm text-white
                  outline-none
                  transition-all
                  focus:border-cyan-500
                  focus:ring-2 focus:ring-cyan-500/20
                "
                value={type}
                onChange={(e) => onTypeChange(e.target.value)}
              >
                <option value="">All types</option>
                <option value="xss">XSS</option>
                <option value="mitm">MITM</option>
                <option value="password">Password</option>
                <option value="ddos">DDoS</option>
                <option value="scanning">Scanning</option>
              </select>

              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
