"use client";

import React from "react";

interface PoolingCardProps {
  isPooled: boolean;
  onToggle: (enabled: boolean) => void;
  directFare: number;
  pickupLabel: string;
  destLabel: string;
}

export default function PoolingCard({
  isPooled,
  onToggle,
  directFare,
  pickupLabel,
  destLabel,
}: PoolingCardProps) {
  const pooledFare = Math.round(directFare * 0.8);
  const savings = directFare - pooledFare;

  return (
    <div className="mt-4 border border-zinc-200 bg-zinc-50/70 rounded-2xl p-4 text-xs space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2.5 cursor-pointer font-bold text-zinc-900">
          <input
            type="checkbox"
            checked={isPooled}
            onChange={(e) => onToggle(e.target.checked)}
            className="w-4 h-4 text-black rounded border-zinc-300 focus:ring-black accent-black"
          />
          <span>Share Ride &amp; Save 20% (PS2 Pooling)</span>
        </label>
        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
          isPooled ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-700"
        }`}>
          {isPooled ? "POOL ACTIVE" : "OPTIONAL"}
        </span>
      </div>

      {isPooled && (
        <div className="space-y-3 pt-3 border-t border-zinc-200">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-zinc-200 shadow-xs">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Fare Comparison</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="line-through text-zinc-400 font-semibold">₹{directFare}</span>
                <span className="text-sm font-black text-emerald-600">₹{pooledFare}</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Save ₹{savings} (20%)
                </span>
              </div>
            </div>
            <div className="text-right text-[11px]">
              <span className="text-zinc-500 block font-medium">Detour Guardrail</span>
              <span className="font-extrabold text-zinc-950">1.18x (&le; 1.35x Limit)</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-zinc-200 space-y-2 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
              Optimized 4-Stop Sequence:
            </span>
            <div className="text-[11px] text-zinc-700 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-black shrink-0">1</span>
                <span>Pickup: <strong className="text-zinc-950">{pickupLabel}</strong> (You)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">2</span>
                <span>Pickup: <strong className="text-zinc-950">Metro Exchange North</strong> (Co-Rider: Priya S.)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-zinc-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">3</span>
                <span>Dropoff: <strong className="text-zinc-950">Tech Park Gate 2</strong> (Co-Rider: Priya S.)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-black shrink-0">4</span>
                <span>Dropoff: <strong className="text-zinc-950">{destLabel}</strong> (You &bull; +4 mins added time)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

