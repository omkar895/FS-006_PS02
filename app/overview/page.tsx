import Link from "next/link";

export default function OverviewPage() {
  return (
    <div className="max-w-6xl mx-auto py-10 px-6 space-y-10">
      {/* Header Banner */}
      <div className="border-b border-[#D6DCD2] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#245A43] animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#245A43]">
              Autonomous Dispatch &amp; Fleet Intelligence
            </span>
            <span className="text-[10px] bg-[#EAECE5] text-[#35423A] font-semibold px-2 py-0.5 rounded border border-[#D6DCD2]">
              PS2 VERIFIED
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18231D]">
            Go-Fair Operations Platform
          </h1>
          <p className="text-[#68746C] mt-2 text-sm max-w-2xl leading-relaxed">
            Intelligent Ride Matching and Dynamic Driver Allocation System. Built with multi-factor algorithmic fairness, 30-minute machine learning demand forecasting, two-passenger corridor pooling, and automated exception reassignment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 bg-[#245A43] hover:bg-[#1b4332] text-white text-xs font-bold rounded shadow-sm transition-colors"
          >
            Launch Persona Login &rarr;
          </Link>
        </div>
      </div>

      {/* Quantitative Operations Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#D6DCD2] rounded-lg p-4">
          <span className="text-[11px] font-bold uppercase text-[#68746C] block">Dispatch Model</span>
          <span className="text-2xl font-extrabold text-[#18231D] mt-1 block">5-Factor</span>
          <span className="text-[11px] text-[#245A43] font-medium block mt-1">ETA, Idle, Dist, Workload, Rel</span>
        </div>

        <div className="bg-white border border-[#D6DCD2] rounded-lg p-4">
          <span className="text-[11px] font-bold uppercase text-[#68746C] block">ML Target Horizon</span>
          <span className="text-2xl font-extrabold text-[#18231D] mt-1 block">t + 30m</span>
          <span className="text-[11px] text-[#245A43] font-medium block mt-1">MAE 2.247 vs Baseline 3.319</span>
        </div>

        <div className="bg-white border border-[#D6DCD2] rounded-lg p-4">
          <span className="text-[11px] font-bold uppercase text-[#68746C] block">Workload Equity</span>
          <span className="text-2xl font-extrabold text-[#245A43] mt-1 block">&gt;60% Gain</span>
          <span className="text-[11px] text-[#68746C] block mt-1">Inequality variance reduced</span>
        </div>

        <div className="bg-white border border-[#D6DCD2] rounded-lg p-4">
          <span className="text-[11px] font-bold uppercase text-[#68746C] block">Pooling Discount</span>
          <span className="text-2xl font-extrabold text-[#18231D] mt-1 block">20% Off</span>
          <span className="text-[11px] text-[#68746C] block mt-1">&le;1.35x Detour &bull; &le;10m added</span>
        </div>
      </div>

      {/* Core Operational Workspaces */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#68746C] mb-4">
          Operational Portals &amp; Workspaces
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Passenger Card */}
          <div className="border border-[#D6DCD2] bg-white rounded-xl p-6 flex flex-col justify-between shadow-sm hover:border-[#245A43] transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#245A43]">Rider Surface</span>
                <span className="text-[10px] bg-[#EAF2ED] text-[#245A43] px-2 py-0.5 rounded font-bold">Client</span>
              </div>
              <h3 className="text-xl font-bold text-[#18231D]">Passenger Portal</h3>
              <p className="text-xs text-[#35423A] mt-2 leading-relaxed">
                Book rides with live OpenStreetMap pickup/destination routing, inspect 5-factor explainability cards, and test two-passenger pooling with 20% discounts.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-[#D6DCD2]">
              <Link
                href="/passenger"
                className="w-full text-center py-2 px-4 rounded bg-[#245A43] text-white text-xs font-bold hover:bg-[#1b4332] transition-colors"
              >
                Open Passenger Workspace
              </Link>
              <Link
                href="/login?role=passenger"
                className="w-full text-center py-1.5 px-4 rounded border border-[#D6DCD2] text-xs font-semibold text-[#35423A] hover:bg-[#EAECE5] transition-colors"
              >
                Sign In as Passenger &rarr;
              </Link>
            </div>
          </div>

          {/* Driver Card */}
          <div className="border border-[#D6DCD2] bg-white rounded-xl p-6 flex flex-col justify-between shadow-sm hover:border-[#245A43] transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#245A43]">Fleet Surface</span>
                <span className="text-[10px] bg-[#EAF2ED] text-[#245A43] px-2 py-0.5 rounded font-bold">Operator</span>
              </div>
              <h3 className="text-xl font-bold text-[#18231D]">Driver Portal</h3>
              <p className="text-xs text-[#35423A] mt-2 leading-relaxed">
                Mobile-first driver terminal. Toggle availability, receive incoming fairness-ranked offers, accept/reject with 30s timers, and advance trip milestones.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-[#D6DCD2]">
              <Link
                href="/driver"
                className="w-full text-center py-2 px-4 rounded bg-[#245A43] text-white text-xs font-bold hover:bg-[#1b4332] transition-colors"
              >
                Open Driver Terminal
              </Link>
              <Link
                href="/login?role=driver"
                className="w-full text-center py-1.5 px-4 rounded border border-[#D6DCD2] text-xs font-semibold text-[#35423A] hover:bg-[#EAECE5] transition-colors"
              >
                Sign In as Driver &rarr;
              </Link>
            </div>
          </div>

          {/* Admin Card */}
          <div className="border border-[#D6DCD2] bg-white rounded-xl p-6 flex flex-col justify-between shadow-sm hover:border-[#245A43] transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#245A43]">Command Center</span>
                <span className="text-[10px] bg-[#D6EE74] text-[#18231D] px-2 py-0.5 rounded font-bold">Supervisor</span>
              </div>
              <h3 className="text-xl font-bold text-[#18231D]">Admin &amp; Simulation</h3>
              <p className="text-xs text-[#35423A] mt-2 leading-relaxed">
                Monitor 6-zone demand heatmaps, bounded surge multipliers (1.0x-3.0x), driver repositioning recommendations, and run the comparative Simulation Lab.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-[#D6DCD2]">
              <Link
                href="/admin"
                className="w-full text-center py-2 px-4 rounded bg-[#245A43] text-white text-xs font-bold hover:bg-[#1b4332] transition-colors"
              >
                Open Admin Console
              </Link>
              <Link
                href="/login?role=admin"
                className="w-full text-center py-1.5 px-4 rounded border border-[#D6DCD2] text-xs font-semibold text-[#35423A] hover:bg-[#EAECE5] transition-colors"
              >
                Sign In as Administrator &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* System Integrity & Contract Guardrails */}
      <div className="bg-[#FAF9F5] border border-[#D6DCD2] rounded-xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#18231D] mb-3">
          Algorithmic Invariants &amp; PS2 System Contract
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#35423A]">
          <div className="p-3 bg-white rounded border border-[#D6DCD2]">
            <span className="font-bold text-[#18231D] block mb-1">State Machine Enforced</span>
            <span>9-stage deterministic lifecycle (requested &rarr; accepted &rarr; arriving &rarr; ongoing &rarr; completed) with transactional event auditing.</span>
          </div>
          <div className="p-3 bg-white rounded border border-[#D6DCD2]">
            <span className="font-bold text-[#18231D] block mb-1">Bounded Surge Ceiling</span>
            <span>Calculated from 30-min forecast pressure, strictly capped at 3.00x to prevent predatory rider price gouging.</span>
          </div>
          <div className="p-3 bg-white rounded border border-[#D6DCD2]">
            <span className="font-bold text-[#18231D] block mb-1">Bounded Reassignment</span>
            <span>Idempotent 3-attempt retry loop that records rejected driver IDs and automatically excludes them from retry cycles.</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#D6DCD2] pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-[#68746C] gap-2">
        <span>Go-Fair Prototype &middot; Next.js 16 App Router &middot; Supabase PostgreSQL &middot; OpenStreetMap</span>
        <span>Version: PS2 Production Final &middot; 38/38 Tests Passing</span>
      </div>
    </div>
  );
}
