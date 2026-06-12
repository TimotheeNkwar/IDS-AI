import { Bell, AlertTriangle, Mail } from "lucide-react";
import { useState } from "react";

export default function Notifications() {
  const [notifications, setNotifications] = useState({
    critical: true,
    medium: true,
    low: false,
    email: false,
  });

  const items = [
    {
      key: "critical",
      label: "Critical alerts",
      sub: "Always notified for high severity threats",
      icon: AlertTriangle,
      accent: "text-red-300 bg-red-500/10 border-red-500/20",
    },
    {
      key: "medium",
      label: "Medium alerts",
      sub: "Notified for medium severity threats",
      icon: Bell,
      accent: "text-yellow-300 bg-yellow-500/10 border-yellow-500/20 ",
    },
    {
      key: "low",
      label: "Low alerts",
      sub: "Notified for low severity events",
      icon: Bell,
      accent: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      key: "email",
      label: "Email notifications",
      sub: "Receive alerts via email",
      icon: Mail,
      accent: "text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/20",
    },
  ];

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
          <Bell className="w-4 h-4 text-fuchsia-400 light:text-fuchsia-500" />

          <div>
            <p
              className="
                text-[11px] uppercase tracking-[0.2em] font-semibold
                text-slate-500 light:text-slate-400
              "
            >
              Alerts
            </p>
            <h2 className="text-xl font-bold text-white light:text-slate-900">
              Notification Settings
            </h2>
          </div>
        </div>

        {/* List */}
        <div
          className="
            rounded-2xl border overflow-hidden
            divide-y divide-slate-700/60
            border-slate-700/60 bg-slate-800/40
            light:border-slate-200 light:bg-slate-50/60
            light:divide-slate-200
          "
        >
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className="
                  flex items-center justify-between px-5 py-4
                  light:hover:bg-slate-50 transition-colors duration-150
                "
              >
                {/* Left */}
                <div className="flex items-start gap-3">
                  <div
                    className={`
                      w-10 h-10 rounded-xl
                      flex items-center justify-center
                      border
                      ${item.accent}
                    `}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white light:text-slate-800">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-400 light:text-slate-500">
                      {item.sub}
                    </p>
                  </div>
                </div>

                {/* Toggle */}
                <input
                  type="checkbox"
                  className="toggle toggle-sm toggle-primary text-fuchsia-500 light:text-fuchsia-600 light:bg-fuchsia-100"
                  checked={
                    notifications[item.key as keyof typeof notifications]
                  }
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      [item.key]: e.target.checked,
                    })
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
