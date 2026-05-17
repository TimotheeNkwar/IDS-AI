import { Activity, ShieldCheck, AlertTriangle } from "lucide-react";

export default function TotalTrafficSummary({ summary }: { summary: any }) {
  const total = summary?.total ?? 0;
  const normal = summary?.normal ?? 0;
  const anomalies =
    summary?.anomalies?.reduce(
      (acc: number, item: any) => acc + item.count,
      0,
    ) ?? 0;

  const cards = [
    {
      title: "Total Traffic",
      value: total,
      icon: Activity,
      color:
        "from-fuchsia-500/20 to-fuchsia-700/10 border-fuchsia-500/20 text-fuchsia-300",
      glow: "shadow-fuchsia-500/10",
    },
    {
      title: "Normal Traffic",
      value: normal,
      icon: ShieldCheck,
      color: "from-cyan-500/20 to-cyan-700/10 border-cyan-500/20 text-cyan-300",
      glow: "shadow-cyan-500/10",
    },
    {
      title: "Anomalous Traffic",
      value: anomalies,
      icon: AlertTriangle,
      color: "from-red-500/20 to-red-700/10 border-red-500/20 text-red-300",
      glow: "shadow-red-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className={`
              group relative overflow-hidden
              rounded-3xl border border-slate-700/60
              bg-slate-900/70 backdrop-blur-xl
              p-6 text-left
              transition-all duration-300
              hover:-translate-y-1
              hover:shadow-2xl ${card.glow}
            `}
          >
            {/* Glow background */}
            <div
              className={`
                absolute inset-0 opacity-0 group-hover:opacity-100
                transition-opacity duration-500
                bg-gradient-to-br ${card.color}
              `}
            />

            <div className="relative flex items-start justify-between">
              {/* Left */}
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-2">
                  Traffic
                </p>

                <h2 className="text-slate-300 text-sm font-medium mb-3">
                  {card.title}
                </h2>

                <p className="text-4xl font-bold text-white">{card.value}</p>
              </div>

              {/* Icon */}
              <div
                className="
                  w-12 h-12 rounded-2xl
                  flex items-center justify-center
                  border border-slate-700
                  bg-slate-800/60
                  text-slate-300
                "
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            {/* Bottom accent line */}
            <div className="mt-5 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`
                  h-full w-full bg-gradient-to-r ${card.color}
                `}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
