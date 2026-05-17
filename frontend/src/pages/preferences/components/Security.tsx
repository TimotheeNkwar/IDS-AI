import { Shield, Sparkles, Lock, KeyRound } from "lucide-react";

export default function Security() {
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
          <Shield className="w-4 h-4 text-fuchsia-400" />

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Security
            </p>
            <h2 className="text-xl font-bold text-white">
              Protection Settings
            </h2>
          </div>
        </div>

        {/* Card */}
        <div
          className="
            rounded-2xl border border-slate-700/60
            bg-slate-800/40
            divide-y divide-slate-700/60
            overflow-hidden
          "
        >
          {/* Auto-lock */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-start gap-3">
              <div
                className="
                  w-10 h-10 rounded-xl
                  flex items-center justify-center
                  bg-slate-900 border border-slate-700
                  text-slate-300
                "
              >
                <Lock className="w-4 h-4" />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  Auto-lock session
                </p>
                <p className="text-xs text-slate-400">
                  Lock after 30 minutes of inactivity
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              className="toggle toggle-sm text-fuchsia-400 toggle-primary"
              defaultChecked
            />
          </div>

          {/* 2FA */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-start gap-3">
              <div
                className="
                  w-10 h-10 rounded-xl
                  flex items-center justify-center
                  bg-slate-900 border border-slate-700
                  text-slate-300
                "
              >
                <KeyRound className="w-4 h-4" />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  Two-factor authentication
                </p>
                <p className="text-xs text-slate-400">
                  Add an extra layer of security
                </p>
              </div>
            </div>

            <span
              className="
                text-xs px-3 py-1 rounded-full
                bg-fuchsia-500/10 text-fuchsia-300
                border border-fuchsia-500/20
              "
            >
              Not configured
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
