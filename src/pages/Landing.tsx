import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, ShieldCheck, Truck, Sparkles } from 'lucide-react';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.22),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(14,116,144,0.24),transparent_38%),linear-gradient(160deg,#0f172a_0%,#111827_50%,#0b1324_100%)] text-slate-100">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="SafetyHub" className="h-9 w-9 object-contain" />
          <div className="text-lg font-semibold tracking-tight">SafetyHub Connect</div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10">
            Sign In
          </Link>
          <a
            href="mailto:nxjaime@gmail.com?subject=SafetyHub%20Demo%20Request"
            className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-300"
          >
            Request Demo
          </a>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-6 pb-20 pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section>
          <div className="mb-4 inline-flex items-center rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
            Fleet Safety Operating System
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-white md:text-6xl">
            Prevent incidents,
            <span className="block text-emerald-300">improve compliance,</span>
            and scale operations.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-300">
            SafetyHub combines fleet operations and risk intelligence into one command center for drivers, equipment, compliance, and coaching.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex items-center rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-emerald-300"
            >
              Try For Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href="mailto:nxjaime@gmail.com?subject=SafetyHub%20Demo%20Request"
              className="inline-flex items-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Talk to Sales
            </a>
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Operations</div>
            <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-white"><Truck className="h-5 w-5 text-emerald-300" /> Asset + Work Order Control</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Safety Intelligence</div>
            <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-white"><ShieldCheck className="h-5 w-5 text-emerald-300" /> Risk Scoring + Coaching</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Compliance</div>
            <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-white"><CalendarCheck className="h-5 w-5 text-emerald-300" /> Inspection + Document Audit Trails</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-gradient-to-r from-emerald-400/20 to-cyan-300/20 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100"><Sparkles className="h-4 w-4" /> Built for fast deployment</div>
            <div className="mt-2 text-sm text-slate-200">Launch with your existing workflows, then iterate with real feedback from your fleet teams.</div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;
