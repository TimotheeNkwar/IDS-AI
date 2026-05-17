import { InfoIcon } from "lucide-react";
import HelpInfo from "./components/HelpInfo";
import FAQ from "./components/FAQ";
import Contact from "./components/Contact";
import SystemInfo from "./components/SystemInfo";

export default function HelpSupportPage() {
  return (
    <div className="p-6 flex flex-col gap-8">
      <div className="border-b border-slate-800 light:border-slate-200 pb-4">
        <h1 className="text-xl font-semibold mb-1 text-white light:text-slate-900">
          Help & support
        </h1>
        <p className="text-sm text-gray-400 light:text-slate-500">
          Find answers, learn how the system works, or get in touch.
        </p>
      </div>

      <HelpInfo />
      <FAQ />
      <Contact />
      <SystemInfo />
    </div>
  );
}
