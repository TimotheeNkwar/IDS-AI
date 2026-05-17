import { Send, Sparkles } from "lucide-react";
import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const inputClass = `
    w-full h-12 px-4 rounded-2xl border outline-none transition-all
    bg-slate-800/70 border-slate-700 text-white placeholder:text-slate-500
    light:bg-white/80 light:border-slate-200 light:text-slate-800
    light:placeholder:text-slate-400
  `;

  return (
    <div
      className="
        relative overflow-hidden
        rounded-3xl border border-slate-700/60
        bg-slate-900/70 backdrop-blur-xl
        light:bg-white/70 light:border-slate-200
        p-8 shadow-2xl
      "
    >
      {/* Glow */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-fuchsia-600/20 blur-3xl rounded-full" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/20 blur-3xl rounded-full" />

      {/* Header */}
      <div className="relative mb-8">
        <div className="flex items-center gap-2 mb-3 text-fuchsia-400 light:text-fuchsia-500">
          <Sparkles className="w-4 h-4" />
          <span className="uppercase tracking-[0.2em] text-xs font-semibold">
            Contact Us
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white light:text-slate-900 mb-2">
          Need help? Get in touch!
        </h1>

        <p className="text-slate-400 light:text-slate-500 text-sm md:text-base">
          Have a question, feedback, or feature request? Send us a message
          and we'll get back to you soon.
        </p>
      </div>

      {/* Form */}
      <div className="relative space-y-5">
        {/* Name + Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-medium text-slate-400 light:text-slate-500 mb-2 block">
              Name
            </label>
            <input
              type="text"
              placeholder="Your name"
              className={`${inputClass} focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 light:focus:border-fuchsia-400 light:focus:ring-fuchsia-400/20`}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 light:text-slate-500 mb-2 block">
              Email
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              className={`${inputClass} focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 light:focus:border-cyan-400 light:focus:ring-cyan-400/20`}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="text-xs font-medium text-slate-400 light:text-slate-500 mb-2 block">
            Subject
          </label>
          <select
            className={`${inputClass} focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 light:focus:border-fuchsia-400 light:focus:ring-fuchsia-400/20`}
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          >
            <option className="bg-slate-900 light:bg-white" value="">Select a topic</option>
            <option className="bg-slate-900 light:bg-white" value="bug">Bug report</option>
            <option className="bg-slate-900 light:bg-white" value="feature">Feature request</option>
            <option className="bg-slate-900 light:bg-white" value="alert">Alert question</option>
            <option className="bg-slate-900 light:bg-white" value="other">Other</option>
          </select>
        </div>

        {/* Message */}
        <div>
          <label className="text-xs font-medium text-slate-400 light:text-slate-500 mb-2 block">
            Message
          </label>
          <textarea
            placeholder="Describe your issue..."
            rows={5}
            className="
              w-full px-4 py-3 rounded-2xl border outline-none transition-all resize-none
              bg-slate-800/70 border-slate-700 text-white placeholder:text-slate-500
              focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20
              light:bg-white/80 light:border-slate-200 light:text-slate-800
              light:placeholder:text-slate-400
              light:focus:border-cyan-400 light:focus:ring-cyan-400/20
            "
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end">
          <button className="group relative overflow-hidden px-6 h-12 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 text-white font-medium shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative flex items-center gap-2">
              <Send className="w-4 h-4" />
              Send Message
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}