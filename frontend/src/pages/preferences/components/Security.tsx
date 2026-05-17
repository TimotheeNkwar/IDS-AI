import { Shield, Lock, KeyRound } from "lucide-react";

export default function Security() {
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
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-fuchsia-500/10 blur-3xl rounded-full" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-fuchsia-400 light:text-fuchsia-500" />

          <div>
            <p
              className="
                text-[11px] uppercase tracking-[0.2em] font-semibold
                text-slate-500 light:text-slate-400
              "
            >
              Security
            </p>
            <h2 className="text-xl font-bold text-white light:text-slate-900">
              Protection Settings
            </h2>
          </div>
        </div>

        {/* Card */}
        <div
          className="
            rounded-2xl border overflow-hidden
            divide-y divide-slate-700/60
            border-slate-700/60 bg-slate-800/40
            light:border-slate-200 light:bg-slate-50/60
            light:divide-slate-200
          "
        >
          {/* Auto-lock */}
          <div className="flex items-center justify-between px-5 py-4 transition-colors duration-150 light:hover:bg-slate-50">
            <div className="flex items-start gap-3">
              <div
                className="
                  w-10 h-10 rounded-xl flex items-center justify-center border
                  bg-slate-900 border-slate-700 text-slate-300
                  light:bg-slate-100 light:border-slate-200 light:text-slate-500
                "
              >
                <Lock className="w-4 h-4" />
              </div>

              <div>
                <p className="text-sm font-medium text-white light:text-slate-800">
                  Auto-lock session
                </p>
                <p className="text-xs text-slate-400 light:text-slate-500">
                  Lock after 30 minutes of inactivity
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary text-fuchsia-400 light:text-fuchsia-600 light:bg-fuchsia-100"
              defaultChecked
            />
          </div>

          {/* 2FA */}
          <div className="flex items-center justify-between px-5 py-4 transition-colors duration-150 light:hover:bg-slate-50">
            <div className="flex items-start gap-3">
              <div
                className="
                  w-10 h-10 rounded-xl flex items-center justify-center border
                  bg-slate-900 border-slate-700 text-slate-300
                  light:bg-slate-100 light:border-slate-200 light:text-slate-500
                "
              >
                <KeyRound className="w-4 h-4" />
              </div>

              <div>
                <p className="text-sm font-medium text-white light:text-slate-800">
                  Two-factor authentication
                </p>
                <p className="text-xs text-slate-400 light:text-slate-500">
                  Add an extra layer of security
                </p>
              </div>
            </div>

            <span
              className="
                text-xs px-3 py-1 rounded-full border
                bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20
                light:bg-fuchsia-50 light:text-fuchsia-600 light:border-fuchsia-200
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
