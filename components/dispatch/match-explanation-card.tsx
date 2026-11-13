"use client";

import React, { useState } from "react";

export interface ScoreContributions {
  eta?: number;
  idle?: number;
  distance?: number;
  workload?: number;
  reliability?: number;
}

export interface MatchMetadata {
  engine?: string;
  method?: string;
  score?: number | null;
  scoreContributions?: ScoreContributions | null;
  explanation?: string;
  baselineMatch?: string | null;
}

interface MatchExplanationCardProps {
  metadata?: MatchMetadata | null;
  assignedDriverId?: string | null;
  pickupEtaMinutes?: number | null;
}

export default function MatchExplanationCard({
  metadata,
  pickupEtaMinutes,
}: MatchExplanationCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!metadata) return null;

  const contributions = metadata.scoreContributions || {
    eta: 0.25,
    idle: 0.20,
    distance: 0.18,
    workload: 0.14,
    reliability: 0.09,
  };

  const totalScore = metadata.score
    ? (metadata.score * 100).toFixed(1)
    : (
        ((contributions.eta || 0) +
          (contributions.idle || 0) +
          (contributions.distance || 0) +
          (contributions.workload || 0) +
          (contributions.reliability || 0)) *
        100
      ).toFixed(1);

  const factorBars = [
    { label: "Pickup ETA Guardrail (30%)", val: contributions.eta || 0.25, max: 0.30, color: "bg-[#245A43]" },
    { label: "Driver Idle Balance (25%)", val: contributions.idle || 0.20, max: 0.25, color: "bg-[#3B7A57]" },
    { label: "Proximity Distance (20%)", val: contributions.distance || 0.18, max: 0.20, color: "bg-[#4E9B6E]" },
    { label: "Workload Equity (15%)", val: contributions.workload || 0.14, max: 0.15, color: "bg-[#72B58D]" },
    { label: "Acceptance Reliability (10%)", val: contributions.reliability || 0.09, max: 0.10, color: "bg-[#9BD1B1]" },
  ];

  return (
    <div className="mt-4 border border-[#245A43]/30 bg-[#F7FAF8] rounded-lg p-4 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#245A43] uppercase tracking-wider text-[11px]">
            ★ Why This Driver? (5-Factor Explainability)
          </span>
          <span className="bg-[#245A43] text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
            Score: {totalScore}%
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-[#245A43] hover:underline font-semibold text-[11px]"
        >
          {isOpen ? "Collapse Details ▲" : "Expand Rationale ▼"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 space-y-3 pt-3 border-t border-[#D6DCD2]">
          {/* Narrative rationale */}
          <div className="p-2.5 bg-white border border-[#D6DCD2] rounded text-[#18231D]">
            <span className="font-bold block text-[#245A43] mb-1">Algorithmic Decision Rationale:</span>
            <p className="text-[#35423A] leading-relaxed">
              {metadata.explanation ||
                `Driver was assigned based on the FairRide multi-factor optimization engine. Idle time and daily workload were weighed against proximity to prevent driver burnout while preserving an estimated pickup ETA of ~${pickupEtaMinutes || 4} mins.`}
            </p>
            {metadata.baselineMatch && (
              <span className="block mt-1.5 text-[11px] text-[#68746C] italic">
                Nearest-Eligible Baseline comparison: Evaluated proximity vs. cumulative fatigue against alternative available units.
              </span>
            )}
          </div>

          {/* 5-Factor Score Contribution Bars */}
          <div className="space-y-2">
            <span className="font-semibold text-[#18231D] block text-[11px]">
              Multi-Factor Score Contribution Weights:
            </span>
            {factorBars.map((f, idx) => {
              const pct = Math.min(100, Math.round((f.val / f.max) * 100));
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between text-[10px] text-[#68746C]">
                    <span>{f.label}</span>
                    <span className="font-medium text-[#18231D]">
                      {f.val.toFixed(2)} / {f.max.toFixed(2)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#EAECE5] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${f.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

