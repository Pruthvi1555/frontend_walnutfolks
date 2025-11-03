import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;


//const SUPABASE_URL = (window as any).ENV_SUPABASE_URL || "https://nekhkrghyxgpvqmywhvu.supabase.co";
//const SUPABASE_ANON_KEY = (window as any).ENV_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5la2hrcmdoeXhncHZxbXl3aHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NjQwMzUsImV4cCI6MjA3NzI0MDAzNX0.bVg5A8TkHZU-aQogmn6fylkjJQ8dan8FaTz8kV677KU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Color palette loosely inspired by superbryn.com (cool blues/greens, soft neutrals)
const COLORS = ["#8BD3E6", "#6FB4D6", "#4D9ACF", "#2F7FBF", "#1C6BAE", "#0F548F", "#87D68D", "#B8E1FF"]; // no strict brand violation, just vibes

// Types
interface ChartSlice { name: string; value: number }
interface SavedRow { email: string; chart_key: string; values_json: ChartSlice[]; updated_at: string }

// Default data
const defaultSadPath: ChartSlice[] = [
  { name: "Caller Identification", value: 32 },
  { name: "Unsupported Language", value: 28 },
  { name: "Customer Hostility", value: 16 },
  { name: "Verbal Aggression", value: 12 },
  { name: "Other", value: 12 },
];

const defaultCallDuration = [
  { label: "Mon", mins: 3.1 },
  { label: "Tue", mins: 4.8 },
  { label: "Wed", mins: 6.2 },
  { label: "Thu", mins: 5.2 },
  { label: "Fri", mins: 4.4 },
  { label: "Sat", mins: 3.8 },
  { label: "Sun", mins: 4.1 },
];

// Utility
function prettyPercent(n: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

export default function App() {
  const [email, setEmail] = useState("");
  const [emailLocked, setEmailLocked] = useState(false);

  const [sadPath, setSadPath] = useState<ChartSlice[]>(defaultSadPath);
  const totalSad = useMemo(() => sadPath.reduce((a, b) => a + (b.value || 0), 0), [sadPath]);

  const [loading, setLoading] = useState(false);
  const [previous, setPrevious] = useState<ChartSlice[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Try to restore last-used email from localStorage (pure convenience)
  useEffect(() => {
    const e = localStorage.getItem("call-analytics-email");
    if (e) { setEmail(e); }
  }, []);

  // Fetch any previously saved values for this email
  async function fetchPreviousValues(forEmail: string) {
    setLoading(true);
    setMessage(null);
    const { data, error } = await supabase
      .from("user_chart_values")
      .select("email, chart_key, values_json, updated_at")
      .eq("email", forEmail)
      .eq("chart_key", "sad_path")
      .maybeSingle();

    if (error && error.code !== "PGRST116") { // ignore No Rows error
      setMessage(`Error fetching previous values: ${error.message}`);
    }
    setPrevious(data?.values_json ?? null);
    setLoading(false);
  }

  async function handleConfirmOverwrite() {
    if (!email) return;
    setLoading(true);
    const payload = { email, chart_key: "sad_path", values_json: sadPath };

    const { error } = await supabase
      .from("user_chart_values")
      .upsert(payload, { onConflict: "email,chart_key" });

    setLoading(false);
    if (error) return setMessage(`Save failed: ${error.message}`);
    setMessage("Saved successfully. Your chart reflects the latest values.");
    setPrevious(sadPath);
  }

  async function handleSave() {
    setMessage(null);
    if (!email) {
      setMessage("Please enter your email first.");
      return;
    }
    setEmailLocked(true);
    localStorage.setItem("call-analytics-email", email);
    await fetchPreviousValues(email);

    // If nothing existed before, just save immediately
    if (!previous) {
      await handleConfirmOverwrite();
    }
  }

  // Handlers for editing one slice
  function updateSlice(index: number, value: number) {
    const copy = [...sadPath];
    copy[index] = { ...copy[index], value: Math.max(0, value) };
    setSadPath(copy);
  }

  // === UI ===
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-10 to-white text-slate-800">
      {/* Header with wave */}
      <header className="relative overflow-hidden bg-gradient-to-r from-sky-300 via-sky-400 to-sky-500">
  <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
    <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white drop-shadow-md">
      Call Analytics Dashboard
    </h1>
    <p className="text-xl md:text-xl font-semibold tracking-tight text-sky drop-shadow-md">
      Insights for voice agents with a clean, ocean-breeze vibe.
    </p>
  </div>
  <svg
    className="absolute bottom-0 left-0 w-full z-0"
    viewBox="0 0 1440 140"
    preserveAspectRatio="none"
    aria-hidden
  >
    <path
      d="M0,64 C240,160 480,0 720,64 C960,128 1200,96 1440,128 L1440,0 L0,0 Z"
      fill="#E6F4FA"
    />
  </svg>
</header>


      <main className="max-w-6xl mx-auto px-6 pb-24 pt-8 grid gap-8">
        {/* Email gate + Save */}
        <section className="rounded-2xl bg-white/70 backdrop-blur border border-sky-100 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Personalize your chart</h2>
          <p className="text-sm text-slate-600 mb-4">Enter your email to load or save your custom values for <span className="font-medium">Sad Path Analysis</span>.</p>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-1">Email</label>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300"
                disabled={emailLocked}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded-xl px-5 py-2 bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-60 shadow"
            >
              {previous === null ? "Load / Save" : "Check Previous"}
            </button>
          </div>
          {message && <p className="mt-3 text-sm text-slate-700">{message}</p>}
          {previous && (
            <div className="mt-4 border rounded-xl p-3 border-amber-200 bg-amber-50">
              <p className="text-sm text-amber-900">
                We found previously saved values for this email. Do you want to overwrite them?
              </p>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="font-medium">Previous</p>
                  <ul className="list-disc pl-5">
                    {previous.map((s, i) => (<li key={i}>{s.name}: {s.value}</li>))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium">New</p>
                  <ul className="list-disc pl-5">
                    {sadPath.map((s, i) => (<li key={i}>{s.name}: {s.value}</li>))}
                  </ul>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={handleConfirmOverwrite} className="rounded-lg bg-sky-600 text-white px-4 py-2 hover:bg-sky-700">Overwrite & Save</button>
                <button onClick={() => setPrevious(null)} className="rounded-lg border px-4 py-2">Cancel</button>
              </div>
            </div>
          )}
        </section>

        {/* Charts row */}
        <section className="grid md:grid-cols-2 gap-8">
          {/* Call Duration Area */}
          <div className="rounded-2xl bg-white/70 backdrop-blur border border-sky-100 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Call Duration Analysis</h3>
            <p className="text-sm text-slate-600 mb-4">Average call length over the past week.</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={defaultCallDuration} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4D9ACF" stopOpacity={0.65} />
                      <stop offset="95%" stopColor="#4D9ACF" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fill: "#334155" }} />
                  <YAxis tick={{ fill: "#334155" }} unit="m" />
                  <Tooltip formatter={(v: any) => `${v} min`} />
                  <Area type="monotone" dataKey="mins" stroke="#4D9ACF" fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sad Path Donut + Editor */}
          <div className="rounded-2xl bg-white/70 backdrop-blur border border-sky-100 p-6 shadow-sm">
  <h3 className="text-lg font-semibold">Sad Path Analysis</h3>
  <p className="text-sm text-slate-600 mb-4">Breakdown of failed-call reasons. Edit values below.</p>

  <div className="flex flex-wrap gap-6">
    {/* Pie Chart */}
    <div className="w-full lg:w-1/2 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={sadPath} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={1}>
            {sadPath.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: any, _name: string, ctx: any) => {
            const slice = ctx?.payload as ChartSlice;
            return [`${v} (${prettyPercent(v as number, totalSad)})`, slice?.name];
          }} />
        </PieChart>
      </ResponsiveContainer>
    </div>

    {/* Editor */}
    <div className="w-full lg:w-1/2 space-y-3">
      {sadPath.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
          <label className="text-sm min-w-[10rem]">{s.name}</label>
          <input
            type="number"
            min={0}
            value={s.value}
            onChange={(e) => updateSlice(i, Number(e.target.value))}
            disabled={!email}
            className="w-24 rounded-lg border border-slate-300 px-3 py-1 focus:ring-2 focus:ring-sky-300 disabled:opacity-50"
          />
        </div>
      ))}
      <div className="pt-2 text-sm text-slate-600">
        Total: <span className="font-medium text-slate-800">{totalSad}</span>
      </div>
      <button onClick={handleSave} disabled={!email || loading} className="rounded-xl bg-sky-600 text-white px-4 py-2 hover:bg-sky-700 disabled:opacity-50">
        Save Values
      </button>
    </div>
  </div>
</div>

        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 pt-6">
          Built with React + TypeScript + Recharts + Supabase. Style vibes inspired by superbryn.com 🌊
        </footer>
      </main>
    </div>
  );
}
