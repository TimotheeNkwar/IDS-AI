import { Send, Sparkles } from "lucide-react";
import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="w-full max-w-3xl relative">
        {/* Glow Effects */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-fuchsia-600/20 blur-3xl rounded-full"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/20 blur-3xl rounded-full"></div>

        {/* Card */}
        <div className="relative backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-fuchsia-400 mb-3">
              <Sparkles className="w-4 h-4" />
              <span className="uppercase tracking-[0.2em] text-xs font-semibold">
                Contact Us
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Let’s talk 👋
            </h1>

            <p className="text-slate-400 text-sm md:text-base">
              Have a question, feedback, or feature request? Send us a message
              and we’ll get back to you soon.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Name + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-2 block">
                  Name
                </label>

                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full h-12 px-4 rounded-2xl bg-slate-800/70 border border-slate-700 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 outline-none transition-all text-white placeholder:text-slate-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-2 block">
                  Email
                </label>

                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full h-12 px-4 rounded-2xl bg-slate-800/70 border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white placeholder:text-slate-500"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs font-medium text-slate-400 mb-2 block">
                Subject
              </label>

              <select
                className="w-full h-12 px-4 rounded-2xl bg-slate-800/70 border border-slate-700 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 outline-none transition-all text-white"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              >
                <option className="bg-slate-900" value="">
                  Select a topic
                </option>
                <option className="bg-slate-900" value="bug">
                  Bug report
                </option>
                <option className="bg-slate-900" value="feature">
                  Feature request
                </option>
                <option className="bg-slate-900" value="alert">
                  Alert question
                </option>
                <option className="bg-slate-900" value="other">
                  Other
                </option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-medium text-slate-400 mb-2 block">
                Message
              </label>

              <textarea
                placeholder="Describe your issue..."
                rows={5}
                className="w-full px-4 py-3 rounded-2xl bg-slate-800/70 border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white placeholder:text-slate-500 resize-none"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>

            {/* Button */}
            <div className="pt-2 flex justify-end">
              <button className="group relative overflow-hidden px-6 h-12 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 text-white font-medium shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>

                <span className="relative flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Send Message
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
