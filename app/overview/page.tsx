"use client";

import React, { useState } from "react";
import Link from "next/link";

const PITCH_SCRIPT =
  "Ride-hailing systems often prioritize proximity, which can leave some drivers repeatedly selected while others remain idle. Go-Fair goes beyond nearest-driver matching. It ranks eligible drivers using pickup ETA, idle time, distance, workload and reliability, and explains why each match was made. It also forecasts demand 30 minutes ahead, recommends driver repositioning, optimizes compatible shared rides and automatically reassigns rejected or unanswered requests. Go-Fair aims to make ride-hailing more balanced, transparent and efficient for passengers and drivers.";

export default function OverviewPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(PITCH_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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

      {/* 30-Second Hackathon Pitch Script Card */}
      <div className="border-2 border-[#245A43] bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#245A43]">
              🎙️ 30-Second Hackathon Pitch Script
            </span>
            <span className="text-[10px] font-bold bg-[#D6EE74] text-[#18231D] px-2 py-0.5 rounded">
              ~30s Speaking Time
            </span>
          </div>
          <button
            onClick={handleCopyPitch}
            className="px-3 py-1 bg-[#F4F3ED] hover:bg-[#EAECE5] text-[#18231D] border border-[#D6DCD2] rounded text-xs font-bold transition-colors cursor-pointer"
          >
            {copied ? "✓ Copied to Clipboard!" : "📋 Copy Pitch Script"}
          </button>
        </div>
        <blockquote className="border-l-4 border-[#245A43] pl-4 py-2 italic text-sm text-[#18231D] leading-relaxed bg-[#FAF9F5] rounded-r">
          &ldquo;{PITCH_SCRIPT}&rdquo;
        </blockquote>
        <div className="mt-3 flex items-center justify-between text-xs text-[#68746C]">
          <span>Core message: Go-Fair is not only a ride-booking interface. It is a dispatch intelligence system that evaluates passenger convenience, driver opportunity and fleet efficiency together.</span>
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
                Mobile-first driver terminal. Toggle availability, receive incoming fairness-ranked offers with 30s auto-reassignment countdowns, and advance trip milestones.
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
                Monitor 6-zone demand heatmaps, bounded surge multipliers (1.0x-3.0x), driver repositioning guidance, and run the comparative Simulation Lab.
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

      {/* Two-Minute Live Demo Sequence Guide */}
      <div className="bg-white border border-[#D6DCD2] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#18231D]">
            ⏱️ Two-Minute Live Hackathon Demo Walkthrough
          </h2>
          <span className="text-[11px] font-semibold text-[#245A43] bg-[#EAF2ED] px-2.5 py-0.5 rounded border border-[#245A43]/20">
            Recommended Presenter Sequence
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-[#FAF9F5] border border-[#D6DCD2] rounded-lg flex flex-col justify-between">
            <div>
              <span className="font-bold text-[#245A43] block mb-1">01 / Passenger Portal</span>
              <p className="text-[#35423A] leading-relaxed">
                Sign in with demo passenger, enter pickup and destination via OSM Search or Hub Presets, and optionally check shared pooling.
              </p>
            </div>
            <Link
              href="/passenger"
              className="mt-3 inline-block font-bold text-[#245A43] hover:underline"
            >
              Go to Passenger &rarr;
            </Link>
          </div>

          <div className="p-4 bg-[#FAF9F5] border border-[#D6DCD2] rounded-lg flex flex-col justify-between">
            <div>
              <span className="font-bold text-[#245A43] block mb-1">02 / Explainable Matching</span>
              <p className="text-[#35423A] leading-relaxed">
                Request a ride and open &ldquo;Why This Driver?&rdquo; card to show 5 scoring factor contributions and nearest-driver comparison.
              </p>
            </div>
            <span className="mt-3 text-[11px] text-[#68746C] block">
              Formula: 0.30·ETA + 0.25·Idle + 0.20·Dist + 0.15·Work + 0.10·Rel
            </span>
          </div>

          <div className="p-4 bg-[#FAF9F5] border border-[#D6DCD2] rounded-lg flex flex-col justify-between">
            <div>
              <span className="font-bold text-[#245A43] block mb-1">03 / Ride Lifecycle &amp; Reassign</span>
              <p className="text-[#35423A] leading-relaxed">
                Use the Presenter Simulator to auto-advance from Accepted to Completed, or test the 30-second driver timeout reassignment.
              </p>
            </div>
            <Link
              href="/driver"
              className="mt-3 inline-block font-bold text-[#245A43] hover:underline"
            >
              Go to Driver &rarr;
            </Link>
          </div>

          <div className="p-4 bg-[#FAF9F5] border border-[#D6DCD2] rounded-lg flex flex-col justify-between">
            <div>
              <span className="font-bold text-[#245A43] block mb-1">04 / Admin Simulation Lab</span>
              <p className="text-[#35423A] leading-relaxed">
                Show 30-min demand forecast, zone pressure P, repositioning guidance, and run Monte Carlo simulation vs nearest-driver baseline.
              </p>
            </div>
            <Link
              href="/admin"
              className="mt-3 inline-block font-bold text-[#245A43] hover:underline"
            >
              Go to Admin &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Stakeholder Value Proposition & Reported Experiment Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stakeholder Value Matrix */}
        <div className="bg-white border border-[#D6DCD2] rounded-xl p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#18231D] mb-4">
            Value Proposition by Stakeholder
          </h3>
          <div className="divide-y divide-[#D6DCD2] text-xs">
            <div className="py-2.5">
              <span className="font-bold text-[#245A43] block">Drivers</span>
              <span className="text-[#35423A]">More balanced access to ride opportunities, lower avoidable idle time, and clearer allocation rationale.</span>
            </div>
            <div className="py-2.5">
              <span className="font-bold text-[#245A43] block">Passengers</span>
              <span className="text-[#35423A]">Transparent driver selection, pickup ETA visibility, bounded simulated surge pricing, and pooled-ride savings.</span>
            </div>
            <div className="py-2.5">
              <span className="font-bold text-[#245A43] block">Cities and Regulators</span>
              <span className="text-[#35423A]">Potential reduction in empty cruising and a more auditable, explainable record of dispatch decisions.</span>
            </div>
            <div className="py-2.5">
              <span className="font-bold text-[#245A43] block">Platform Operators</span>
              <span className="text-[#35423A]">A quantitative method to compare fleet utilization and allocation fairness alongside passenger waiting time.</span>
            </div>
          </div>
        </div>

        {/* Project-Reported Experiment Results Table */}
        <div className="bg-white border border-[#D6DCD2] rounded-xl p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#18231D] mb-4">
            Project-Reported Experiment Results
          </h3>
          <div className="border border-[#D6DCD2] rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#FAF9F5] border-b border-[#D6DCD2] text-[#68746C] text-[11px] font-bold">
                <tr>
                  <th className="p-2.5">Measure</th>
                  <th className="p-2.5">Reported Value</th>
                  <th className="p-2.5">How to Present It</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6DCD2] text-[#35423A]">
                <tr>
                  <td className="p-2.5 font-semibold text-[#18231D]">Demand Forecast MAE</td>
                  <td className="p-2.5 font-bold text-[#245A43]">2.2470</td>
                  <td className="p-2.5 text-[#68746C]">Reported versus historical-average baseline MAE of 3.3189.</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-[#18231D]">Workload Std Dev</td>
                  <td className="p-2.5 font-bold text-[#245A43]">Approx. 3.4 &rarr; 1.2</td>
                  <td className="p-2.5 text-[#68746C]">Reduction of more than 60% workload inequality in simulation.</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-[#18231D]">Pickup ETA Trade-off</td>
                  <td className="p-2.5 font-bold text-[#18231D]">Approx. +0.4 min</td>
                  <td className="p-2.5 text-[#68746C]">Described as ~24s average pickup difference for 60% fairness gain.</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-[#18231D]">Pooling Discount</td>
                  <td className="p-2.5 font-bold text-[#245A43]">20%</td>
                  <td className="p-2.5 text-[#68746C]">Project-defined fare discount for both passengers in a compatible pool.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <span className="block text-[11px] text-[#68746C] mt-3 italic">
            * Benchmark note: Re-run live in Simulation Lab on /admin to verify results empirically on synthetic distributions.
          </span>
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
            <span>Calculated as min(3.00, max(1.00, 1.0 + 0.3·(P - 1))), strictly capped at 3.00x to prevent predatory rider price gouging.</span>
          </div>
          <div className="p-3 bg-white rounded border border-[#D6DCD2]">
            <span className="font-bold text-[#18231D] block mb-1">Bounded Reassignment</span>
            <span>Idempotent 3-attempt retry loop that records rejected driver IDs and automatically reassigns on 30-second inactivity.</span>
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
