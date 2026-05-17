import { useThemeStore } from "../stores/themeStore";

// Shared tokens for all pie/donut chart cards
export function useChartTokens() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return {
    card: isDark
      ? "border-slate-700/60 bg-slate-900/70 backdrop-blur-xl"
      : "border-slate-200 bg-white",
    glowFuchsia: isDark ? "bg-fuchsia-500/10 blur-3xl" : "hidden",
    glowCyan: isDark ? "bg-cyan-500/10 blur-3xl" : "hidden",
    iconFuchsia: isDark ? "text-fuchsia-400" : "text-violet-500",
    iconCyan: isDark ? "text-cyan-400" : "text-cyan-600",
    title: isDark ? "text-white" : "text-slate-900",
    tooltipBg: isDark ? "#0f172a" : "#ffffff",
    tooltipBorder: isDark ? "#334155" : "#e2e8f0",
    tooltipColor: isDark ? "#fff" : "#1e293b",
    legendColor: isDark ? "#94a3b8" : "#64748b",
  };
}
