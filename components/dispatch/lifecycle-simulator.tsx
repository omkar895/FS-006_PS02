"use client";

import React, { useState, useEffect } from "react";
import { RideStatus } from "@/lib/schemas/database";

interface LifecycleSimulatorProps {
  rideId: string;
  currentStatus: RideStatus;
  onRefresh: () => Promise<void>;
}

const MILESTONES: RideStatus[] = ["requested", "accepted", "arriving", "ongoing", "completed"];

const MILESTONE_LABELS: Record<string, string> = {
  requested: "Offer Dispatched",
  accepted: "Driver Accepted",
  arriving: "En Route to Pickup",
  ongoing: "Trip in Progress",
  completed: "Ride Completed & Fare Settled",
};

export default function LifecycleSimulator({
  rideId,
  currentStatus,
  onRefresh,
}: LifecycleSimulatorProps) {
  const [advancing, setAdvancing] = useState(false);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentIdx = MILESTONES.indexOf(currentStatus);
  const isTerminal = ["completed", "cancelled", "expired"].includes(currentStatus);

  const handleAdvanceStep = async () => {
    if (isTerminal || advancing) return;
    setAdvancing(true);
    setError(null);

    try {
      const res = await fetch(`/api/rides/${rideId}/simulate-advance`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Advance step failed");
      }
      await onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to advance milestone");
      setAutoPlaying(false);
    } finally {
      setAdvancing(false);
    }
  };

  useEffect(() => {
    let active = true;

    if (autoPlaying && !isTerminal) {
      const timer = setTimeout(async () => {
        if (!active) return;
        setAdvancing(true);
        setError(null);
        try {
          const res = await fetch(`/api/rides/${rideId}/simulate-advance`, {
            method: "POST",
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error?.message || "Advance step failed");
          }
          if (active) {
            await onRefresh();
          }
        } catch (err: unknown) {
          if (active) {
            setError(err instanceof Error ? err.message : "Failed to advance milestone");
            setAutoPlaying(false);
          }
        } finally {
          if (active) {
            setAdvancing(false);
          }
        }
      }, 2500);

      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [autoPlaying, currentStatus, isTerminal, rideId, onRefresh]);

  return (
    <div className="mt-4 p-4 border border-[#D6EE74] bg-[#FAFDF0] rounded-lg text-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#18231D] uppercase tracking-wider text-[11px]">
            ⚡ Solo Presenter Simulator
          </span>
          <span className="text-[10px] bg-[#D6EE74] text-[#18231D] font-bold px-2 py-0.5 rounded">
            Live Lifecycle Controls
          </span>
        </div>
        <span className="text-[11px] text-[#68746C] font-medium">
          Status: <strong className="text-[#18231D] uppercase">{currentStatus}</strong>
        </span>
      </div>

      {error && (
        <div className="p-2 bg-red-50 border border-red-200 text-[#B7443E] rounded text-[11px]">
          {error}
        </div>
      )}

      {/* Milestone Stepper */}
      <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
        {MILESTONES.map((st, idx) => {
          const isDone = currentIdx >= idx;
          const isCurrent = currentStatus === st;
          return (
            <div
              key={st}
              className={`p-1.5 rounded border transition-all ${
                isCurrent
                  ? "bg-[#245A43] text-white font-bold border-[#245A43] shadow-sm"
                  : isDone
                  ? "bg-[#EAF2ED] text-[#245A43] border-[#245A43]/30 font-medium"
                  : "bg-white text-gray-400 border-gray-200"
              }`}
            >
              <span className="block">{idx + 1}. {st}</span>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-[#35423A] bg-white p-2 rounded border border-[#D6DCD2] flex items-center justify-between">
        <span>Current Milestone: <strong>{MILESTONE_LABELS[currentStatus] || currentStatus}</strong></span>
        {advancing && <span className="animate-pulse text-[#245A43] font-bold">Updating state...</span>}
      </div>

      {/* Action Buttons */}
      {!isTerminal ? (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleAdvanceStep}
            disabled={advancing || autoPlaying}
            className="flex-1 py-2 px-3 border border-[#245A43] bg-white hover:bg-[#EAF2ED] text-[#245A43] font-bold rounded transition-colors disabled:opacity-50"
          >
            {advancing ? "Advancing..." : `▶ Advance Next Milestone (${MILESTONES[currentIdx + 1] || "Done"})`}
          </button>

          <button
            onClick={() => setAutoPlaying(!autoPlaying)}
            disabled={advancing}
            className={`py-2 px-4 font-bold rounded transition-colors text-white ${
              autoPlaying
                ? "bg-[#B7443E] hover:bg-red-700"
                : "bg-[#245A43] hover:bg-[#1b4332]"
            }`}
          >
            {autoPlaying ? "⏹ Stop Auto-Play" : "⚡ Auto-Play Full Trip"}
          </button>
        </div>
      ) : (
        <div className="p-2 text-center bg-[#EAF2ED] text-[#245A43] font-bold rounded border border-[#245A43]/30">
          ✓ Ride Completed &amp; Settled! Ready to book next demonstration ride.
        </div>
      )}
    </div>
  );
}
