import { Shield } from "lucide-react";
import { useState } from "react";

export default function Security() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");

  return (
    <div
      className="
        relative overflow-hidden
        rounded-3xl border border-slate-700/60
        bg-slate-900/70 backdrop-blur-xl
        light:bg-white/70 light:border-slate-200
        p-6
      "
    >
      {/* Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-fuchsia-500/10 blur-3xl rounded-full" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-cyan-400 light:text-cyan-500" />
          <div>
            <p
              className="
                text-[11px] uppercase tracking-[0.2em] font-semibold
                text-slate-500 light:text-slate-400
              "
            >
              Privacy
            </p>
            <h2 className="text-xl font-bold text-white light:text-slate-900">
              Security
            </h2>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Two-factor toggle row */}
          <div
            className="
              flex items-center justify-between
              px-4 py-3 rounded-2xl border
              border-slate-700 bg-slate-800/40
              light:border-slate-200 light:bg-white/50
            "
          >
            <div>
              <p className="text-sm font-medium text-slate-200 light:text-slate-800">
                Two-factor authentication
              </p>
              <p className="text-xs text-slate-500 light:text-slate-400">
                Require a second verification step on sign-in
              </p>
            </div>

            <button
              onClick={() => setTwoFactor((v) => !v)}
              className={`
                relative w-11 h-6 rounded-full border transition-all duration-300
                ${
                  twoFactor
                    ? "bg-cyan-500/30 border-cyan-500/40 light:bg-cyan-100 light:border-cyan-300"
                    : "bg-slate-800 border-slate-700 light:bg-slate-100 light:border-slate-200"
                }
              `}
              aria-checked={twoFactor}
              role="switch"
            >
              <span
                className={`
                  absolute top-0.5 w-5 h-5 rounded-full border transition-all duration-300
                  ${
                    twoFactor
                      ? "left-[22px] bg-cyan-400 border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.5)] light:bg-cyan-500 light:border-cyan-400 light:shadow-none"
                      : "left-0.5 bg-slate-600 border-slate-500 light:bg-slate-300 light:border-slate-200"
                  }
                `}
              />
            </button>
          </div>

          {/* Session timeout select */}
          <div className="flex flex-col gap-2">
            <label
              className="
                text-xs font-semibold uppercase tracking-widest
                text-slate-500 light:text-slate-400
              "
            >
              Session timeout
            </label>
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              className="
                w-full px-4 py-3 rounded-2xl border appearance-none
                bg-slate-800/40 border-slate-700 text-slate-200
                focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800/60
                transition-all duration-200
                light:bg-white/50 light:border-slate-200 light:text-slate-800
                light:focus:border-cyan-400 light:focus:bg-white/80
              "
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="240">4 hours</option>
              <option value="0">Never</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
