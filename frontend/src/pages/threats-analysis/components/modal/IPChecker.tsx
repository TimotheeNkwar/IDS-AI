// components/IPChecker.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Server,
  Activity,
  AlertTriangle,
} from "lucide-react";

import { threatService } from "../../../../services/threatService";
import type { AbuseResult } from "../../../../types/types";

export default function IPChecker({ defaultIP = "" }: { defaultIP?: string }) {
  const [ip, setIp] = useState(defaultIP);
  const [result, setResult] = useState<AbuseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    checks_today: number;
    cache_size: number;
  } | null>(null);

  const isValidIP = useCallback((value: string) => {
    return /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(
      value,
    );
  }, []);
  const ipRef = useRef(ip);
  useEffect(() => {
    ipRef.current = ip;
  }, [ip]);
  useEffect(() => {
    threatService.getStats().then((r) => setStats(r.data));
  }, []);

  const check = useCallback(
    async (ipToCheck?: string) => {
      const cleanIP = (ipToCheck ?? ipRef.current).trim(); // ← toujours la valeur courante
      if (!cleanIP) return;
      if (!isValidIP(cleanIP)) {
        setError("Invalid IP address.");
        return;
      }
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const r = await threatService.checkIP(cleanIP);
        setResult(r.data.result);
      } catch {
        setError("Unable to query threat intelligence service.");
      } finally {
        setLoading(false);
      }
    },
    [isValidIP],
  );

  useEffect(() => {
    setIp(defaultIP);
    setResult(null);
    setError(null);
    if (defaultIP && isValidIP(defaultIP)) {
      check(defaultIP);
    }
  }, [defaultIP]);

  const riskColor = (score: number) => {
    if (score >= 80) {
      return {
        badge: "text-red-300 bg-red-500/10 border-red-500/20",
        bar: "bg-red-500",
        glow: "shadow-red-500/10",
        icon: <ShieldAlert className="w-5 h-5" />,
      };
    }

    if (score >= 30) {
      return {
        badge: "text-yellow-300 bg-yellow-500/10 border-yellow-500/20",
        bar: "bg-yellow-500",
        glow: "shadow-yellow-500/10",
        icon: <AlertTriangle className="w-5 h-5" />,
      };
    }

    return {
      badge: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
      bar: "bg-emerald-500",
      glow: "shadow-emerald-500/10",
      icon: <ShieldCheck className="w-5 h-5" />,
    };
  };

  const risk = result ? riskColor(result.abuse_score) : null;

  return (
    <div
      className="
        relative 
         border border-slate-700/60
        bg-slate-900/70 backdrop-blur-xl
        p-6
      "
    >
      {/* Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-fuchsia-500/10 blur-3xl rounded-full" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full" />

      <div className="relative flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-fuchsia-400" />

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Threat Intelligence
            </p>

            <h2 className="text-xl font-bold text-white">
              IP Reputation Checker
            </h2>
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <label
            className="
              flex items-center gap-3
              flex-1 px-4 h-12
              rounded-2xl
              border border-slate-700
              bg-slate-800/50
              focus-within:border-fuchsia-500/50
              transition-all duration-300
            "
          >
            <Search className="w-4 h-4 text-slate-500" />

            <input
              type="text"
              placeholder="ex: 37.187.4.26"
              value={ip}
              autoFocus
              onChange={(e) => {
                setIp(e.target.value);
                ipRef.current = e.target.value;
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  check();
                }
              }}
              className="
                bg-transparent outline-none border-none
                flex-1 text-sm text-white
                placeholder:text-slate-500
              "
            />
          </label>

          <button
            onClick={() => check(ipRef.current)}
            disabled={loading}
            className="
              h-12 px-5 rounded-2xl
              bg-fuchsia-600 hover:bg-fuchsia-500
              disabled:opacity-60
              transition-all duration-300
              text-white font-medium
              flex items-center justify-center gap-2
              min-w-[120px]
            "
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                Check IP
              </>
            )}
          </button>
        </div>
        {stats && (
          <p className="text-xs text-slate-500 text-right">
            {stats.checks_today}/1000 checks today
          </p>
        )}
        {/* Error */}
        {error && (
          <div
            className="
              rounded-2xl border border-red-500/20
              bg-red-500/10
              px-4 py-3
              text-sm text-red-300
            "
          >
            {error}
          </div>
        )}

        {/* Result */}
        {result && risk && (
          <div
            className={`
              relative overflow-hidden
              rounded-3xl border border-slate-700/60
              bg-slate-800/40
              p-5
              shadow-2xl ${risk.glow}
            `}
          >
            {/* glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

            {/* top */}
            <div className="relative flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-2">
                  IP Address
                </p>

                <h3 className="font-mono text-2xl font-bold text-white">
                  {ip}
                </h3>
              </div>

              <div
                className={`
                  px-3 py-2 rounded-2xl border
                  flex items-center gap-2
                  ${risk.badge}
                `}
              >
                {risk.icon}

                <span className="text-sm font-semibold">
                  {result.risk_label}
                </span>
              </div>
            </div>

            {/* score */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
                  Abuse Score
                </p>

                <span className="text-sm font-semibold text-white">
                  {result.abuse_score}%
                </span>
              </div>

              <div className="h-2 rounded-full overflow-hidden bg-slate-700/50">
                <div
                  className={`
                    h-full rounded-full transition-all duration-700
                    ${risk.bar}
                  `}
                  style={{
                    width: `${result.abuse_score}%`,
                  }}
                />
              </div>
            </div>

            {/* info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="
                  rounded-2xl border border-slate-700/50
                  bg-slate-900/40
                  p-4 flex items-start gap-3
                "
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300">
                  <Server className="w-4 h-4" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                    ISP
                  </p>

                  <p className="text-sm text-white font-medium">{result.isp}</p>

                  <p className="text-xs text-slate-400 mt-1">
                    {result.usage_type}
                  </p>
                </div>
              </div>

              <div
                className="
                  rounded-2xl border border-slate-700/50
                  bg-slate-900/40
                  p-4 flex items-start gap-3
                "
              >
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-300">
                  <Globe className="w-4 h-4" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                    Location
                  </p>

                  <p className="text-sm text-white font-medium">
                    {result.country}
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Reports: {result.total_reports}
                  </p>
                </div>
              </div>
            </div>

            {/* tor */}
            {result.is_tor && (
              <div
                className="
                  mt-4 rounded-2xl
                  border border-red-500/20
                  bg-red-500/10
                  px-4 py-3
                  text-sm text-red-300
                  flex items-center gap-2
                "
              >
                <ShieldAlert className="w-4 h-4" />
                Tor Exit Node Detected
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
