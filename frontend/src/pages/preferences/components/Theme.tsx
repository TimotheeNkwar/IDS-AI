import { Monitor, Moon, Sun, Sparkles } from "lucide-react";
import React, { useState } from "react";

type Theme = "dark" | "light" | "system";

export default function Theme() {
  const [theme, setTheme] = useState<Theme>("dark");

  const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="w-5 h-5" /> },
    { value: "dark", label: "Dark", icon: <Moon className="w-5 h-5" /> },
    { value: "system", label: "System", icon: <Monitor className="w-5 h-5" /> },
  ];

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
          <Sparkles className="w-4 h-4 text-fuchsia-400" />

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Appearance
            </p>
            <h2 className="text-xl font-bold text-white">Theme Settings</h2>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {THEMES.map((t) => {
            const active = theme === t.value;

            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`
                  group relative overflow-hidden
                  flex flex-col items-center gap-3
                  p-5 rounded-2xl border
                  transition-all duration-300
                  cursor-pointer
                  ${
                    active
                      ? "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300 shadow-lg shadow-fuchsia-500/10"
                      : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600 hover:-translate-y-1"
                  }
                `}
              >
                {/* hover glow */}
                <div
                  className={`
                    absolute inset-0 opacity-0 group-hover:opacity-100
                    transition-opacity duration-500
                    bg-gradient-to-br from-fuchsia-500/10 to-cyan-500/10
                  `}
                />

                {/* Icon */}
                <div
                  className={`
                    relative w-12 h-12 rounded-2xl
                    flex items-center justify-center
                    border
                    transition-all duration-300
                    ${
                      active
                        ? "bg-fuchsia-500/10 border-fuchsia-500/30"
                        : "bg-slate-900 border-slate-700"
                    }
                  `}
                >
                  {t.icon}
                </div>

                {/* Label */}
                <span className="relative text-sm font-medium">{t.label}</span>

                {/* Active indicator */}
                {active && (
                  <span className="absolute bottom-2 w-2 h-2 rounded-full bg-fuchsia-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
