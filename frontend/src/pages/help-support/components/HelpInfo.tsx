import {
  BookOpen,
  Computer,
  MessageCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function HelpInfo() {
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
        <div className="mb-6">
          <div className="flex items-center gap-2 text-fuchsia-400 mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="uppercase tracking-[0.2em] text-[11px] font-semibold">
              Help Center
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white">
            How can we assist you?
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Access documentation, support, or report issues directly from here.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: BookOpen,
              label: "Documentation",
              sub: "Full API and usage guides",
              color:
                "from-fuchsia-500/20 to-fuchsia-700/10 border-fuchsia-500/20 text-fuchsia-300",
            },
            {
              icon: MessageCircle,
              label: "Contact support",
              sub: "Get help from the team",
              color:
                "from-cyan-500/20 to-cyan-700/10 border-cyan-500/20 text-cyan-300",
            },
            {
              icon: Computer,
              label: "Report issues",
              sub: "Report bugs & contribute",
              color:
                "from-yellow-500/20 to-yellow-700/10 border-yellow-500/20 text-yellow-300",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="
                  group relative overflow-hidden
                  rounded-2xl border border-slate-700/60
                  bg-slate-800/40
                  p-5 cursor-pointer
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:border-slate-600
                "
              >
                {/* Hover glow */}
                <div
                  className={`
                    absolute inset-0 opacity-0 group-hover:opacity-100
                    transition-opacity duration-500
                    bg-gradient-to-br ${item.color}
                  `}
                />

                <div className="relative flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="
                      w-12 h-12 rounded-2xl
                      flex items-center justify-center
                      bg-slate-900 border border-slate-700
                      text-slate-300
                      group-hover:scale-105 transition-transform
                    "
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white flex items-center justify-between">
                      {item.label}
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </p>

                    <p className="text-xs text-slate-400 mt-1">{item.sub}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
