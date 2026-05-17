import { useState } from "react";
import { Moon, Sun, Monitor, Clock, Bell, Shield, Save } from "lucide-react";
import Theme from "./components/Theme";
import Hours from "./components/Hours";
import Notifications from "./components/Notifications";
import Security from "./components/Security";

export default function PreferencesPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur-xl p-5">
        {/* Glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-fuchsia-500/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-fuchsia-400" />
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Settings
            </p>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Preferences</h1>

          <p className="text-sm text-slate-400 leading-relaxed">
            Customize the interface and default behaviour of the system.
          </p>
        </div>
      </div>
      <Theme />
      <Hours />
      <Notifications />
      <Security />

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`btn btn-sm gap-2 transition-all duration-200 border backdrop-blur-md
      ${
        saved
          ? "bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.25)]"
          : "bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-200 border-fuchsia-500/30 shadow-[0_0_12px_rgba(217,70,239,0.25)]"
      }`}
        >
          <Save className="w-4 h-4" />
          {saved ? "Saved!" : "Save preferences"}
        </button>
      </div>
    </div>
  );
}
