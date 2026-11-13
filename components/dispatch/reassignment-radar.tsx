"use client";

import React, { useState, useEffect, useCallback } from "react";

interface ReassignmentRadarProps {
  rideId: string;
  status: string;
  pickupLabel: string;
  destinationLabel: string;
  distanceKm: number;
  initialEtaMinutes?: number | null;
  onReassigned?: (newDriverId: string) => void;
  onCancel?: () => void;
}

export function ReassignmentRadar({
  rideId,
  pickupLabel,
  destinationLabel,
  distanceKm,
  onReassigned,
  onCancel,
}: ReassignmentRadarProps) {
  const [currentWave, setCurrentWave] = useState<1 | 2 | 3>(2);
  const [countdown, setCountdown] = useState(10);
  const [isReassigning, setIsReassigning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reassignSuccess, setReassignSuccess] = useState(false);

  const handleForceReassign = useCallback(async () => {
    if (isReassigning) return;
    setIsReassigning(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/dispatch/${rideId}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "SEARCH_EXPANSION" }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Reassignment wave failed");
      }

      const newDriverId = json.data?.newDriverId;
      if (newDriverId) {
        setReassignSuccess(true);
        if (onReassigned) {
          onReassigned(newDriverId);
        }
      } else {
        // Escalate wave if not found yet
        setCurrentWave((prev) => (prev < 3 ? ((prev + 1) as 2 | 3) : 3));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to allocate driver";
      setErrorMsg(msg);
    } finally {
      setIsReassigning(false);
    }
  }, [isReassigning, onReassigned, rideId]);

  // Auto-countdown timer for dynamic wave escalation
  useEffect(() => {
    if (reassignSuccess) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-trigger next wave
          handleForceReassign();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleForceReassign, reassignSuccess]);

  return (
    <div className="bg-zinc-950 text-white border-2 border-zinc-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden transition-all animate-in fade-in">
      {/* Background Ambience & Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

      {/* Top Banner */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <div className="text-xs font-black tracking-wider uppercase text-emerald-400 flex items-center gap-2">
              <span>PS2 Reassignment & Allocation Radar</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px] text-emerald-300 font-mono">
                Active
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">
              No immediate driver within 5-min threshold &bull; Escalating search waves
            </div>
          </div>
        </div>

        {/* Wave Badge */}
        <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700/80 text-[11px] font-bold text-zinc-200">
          Wave {currentWave}: {currentWave === 1 ? "Proximity" : currentWave === 2 ? "Dynamic Expansion" : "Regional Corridor"}
        </div>
      </div>

      {/* Center Radar Scanner Visual */}
      <div className="my-4 py-4 flex flex-col items-center justify-center relative">
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Concentric Radar Rings */}
          <div className="absolute w-40 h-40 rounded-full border border-emerald-500/20 animate-pulse"></div>
          <div className="absolute w-28 h-28 rounded-full border border-emerald-500/30"></div>
          <div className="absolute w-16 h-16 rounded-full border border-emerald-500/40"></div>

          {/* Crosshairs */}
          <div className="absolute w-full h-[1px] bg-emerald-500/20"></div>
          <div className="absolute h-full w-[1px] bg-emerald-500/20"></div>

          {/* Radar Sweep Effect */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="w-full h-full bg-gradient-to-tr from-emerald-500/25 via-transparent to-transparent origin-center animate-spin [animation-duration:3s]"></div>
          </div>

          {/* Central Pickup Reticle */}
          <div className="relative z-10 w-4 h-4 rounded-full bg-emerald-400 border-2 border-zinc-950 flex items-center justify-center shadow-[0_0_12px_#34d399]">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-950"></div>
          </div>

          {/* Simulated Fleet Candidate Blips */}
          <div className="absolute top-8 right-10 w-2.5 h-2.5 rounded-full bg-amber-400 border border-zinc-950 animate-ping"></div>
          <div className="absolute top-8 right-10 w-2 h-2 rounded-full bg-amber-400 border border-zinc-950"></div>
          <div className="absolute bottom-10 left-8 w-2 h-2 rounded-full bg-emerald-400 border border-zinc-950 opacity-80"></div>
          <div className="absolute top-14 left-10 w-2 h-2 rounded-full bg-blue-400 border border-zinc-950 opacity-70"></div>
        </div>

        <div className="mt-3 text-center">
          <span className="text-xs font-bold text-zinc-200 block">
            Scanning Active Fleet for Route ({distanceKm} km)
          </span>
          <span className="text-[11px] text-zinc-400">
            {pickupLabel.slice(0, 24)}... &rarr; {destinationLabel.slice(0, 24)}...
          </span>
        </div>
      </div>

      {/* Wave Progression Indicator */}
      <div className="grid grid-cols-3 gap-2 my-3 text-[11px]">
        <div className={`p-2 rounded-xl border text-center transition-all ${
          currentWave >= 1 ? "bg-zinc-900 border-zinc-700 text-zinc-300" : "bg-zinc-900/50 border-zinc-800 text-zinc-600"
        }`}>
          <div className="font-bold text-[10px] uppercase text-zinc-400">Wave 1</div>
          <div className="text-[11px] font-semibold text-zinc-200">Proximity (5 km)</div>
          <div className="text-[9px] text-amber-400 mt-0.5">Threshold Exceeded</div>
        </div>
        <div className={`p-2 rounded-xl border text-center transition-all ${
          currentWave >= 2 ? "bg-emerald-950/60 border-emerald-500/50 text-white ring-1 ring-emerald-500/40" : "bg-zinc-900/50 border-zinc-800 text-zinc-600"
        }`}>
          <div className="font-bold text-[10px] uppercase text-emerald-400">Wave 2</div>
          <div className="text-[11px] font-bold text-white">Expanded (25 km)</div>
          <div className="text-[9px] text-emerald-300 mt-0.5 animate-pulse">Active Scanning</div>
        </div>
        <div className={`p-2 rounded-xl border text-center transition-all ${
          currentWave >= 3 ? "bg-zinc-900 border-zinc-700 text-zinc-300" : "bg-zinc-900/50 border-zinc-800 text-zinc-600"
        }`}>
          <div className="font-bold text-[10px] uppercase text-zinc-400">Wave 3</div>
          <div className="text-[11px] font-semibold text-zinc-200">Cross-Corridor</div>
          <div className="text-[9px] text-zinc-500 mt-0.5">Armed Fallback</div>
        </div>
      </div>

      {/* Live Algorithmic Telemetry */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 my-3 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 text-[11px]">Fleet Candidates Evaluated:</span>
          <span className="font-mono font-bold text-emerald-400">4 Drivers Checked</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 text-[11px]">Guardrail Protocol:</span>
          <span className="font-bold text-zinc-200">Dynamic ETA Expansion</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 text-[11px]">Multi-Factor Fairness Vector:</span>
          <span className="font-mono text-[10px] text-zinc-300">ETA 30% | Idle 25% | Workload 15%</span>
        </div>
      </div>

      {/* Countdown Progress Bar */}
      <div className="my-3">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
          <span>Escalating to next allocation wave:</span>
          <span className="font-mono font-bold text-emerald-400">{countdown}s</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${(countdown / 10) * 100}%` }}
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs my-2">
          {errorMsg}
        </div>
      )}

      {/* Action CTA Buttons */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
        <button
          onClick={handleForceReassign}
          disabled={isReassigning}
          className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-zinc-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isReassigning ? (
            <>
              <span className="animate-spin text-sm">↻</span>
              <span>Allocating Best Match...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Force Best Match (PS2 Expansion)</span>
            </>
          )}
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isReassigning}
            className="py-3 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs transition-all cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
