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
    <div className="mt-4 border border-[#245A43]/20 bg-[#F5F8F6] rounded-lg p-3.5 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer font-bold text-[#18231D]">
          <input
            type="checkbox"
            checked={isPooled}
            onChange={(e) => onToggle(e.target.checked)}
            className="w-4 h-4 text-[#245A43] rounded border-gray-300 focus:ring-[#245A43]"
          />
          <span>Share Ride &amp; Save 20% (PS2 Pooling)</span>
        </label>
        <span className="text-[10px] font-bold bg-[#D6EE74] text-[#18231D] px-2 py-0.5 rounded">
          {isPooled ? "POOL ACTIVE" : "OPTIONAL"}
        </span>
      </div>

      {isPooled && (
        <div className="space-y-2.5 pt-2 border-t border-[#D6DCD2]">
          <div className="flex items-center justify-between bg-white p-2.5 rounded border border-[#D6DCD2]">
            <div>
              <span className="text-[10px] text-[#68746C] uppercase font-bold block">Fare Comparison</span>
              <div className="flex items-center gap-2">
                <span className="line-through text-[#68746C]">₹{directFare}</span>
                <span className="text-sm font-bold text-[#245A43]">₹{pooledFare}</span>
                <span className="text-[10px] font-bold text-[#245A43] bg-[#EAF2ED] px-1.5 py-0.5 rounded">
                  Save ₹{savings} (20%)
                </span>
              </div>
            </div>
            <div className="text-right text-[11px]">
              <span className="text-[#68746C] block">Detour Guardrail</span>
              <span className="font-bold text-[#18231D]">1.18x (&le; 1.35x Limit)</span>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded border border-[#D6DCD2] space-y-1">
            <span className="text-[10px] font-bold uppercase text-[#245A43] block">
              Optimized 4-Stop Sequence:
            </span>
            <div className="text-[11px] text-[#35423A] space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#245A43] text-white flex items-center justify-center text-[9px] font-bold">1</span>
                <span>Pickup: <strong>{pickupLabel}</strong> (You)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#3B7A57] text-white flex items-center justify-center text-[9px] font-bold">2</span>
                <span>Pickup: <strong>Metro Exchange North</strong> (Co-Rider: Priya S.)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#68746C] text-white flex items-center justify-center text-[9px] font-bold">3</span>
                <span>Dropoff: <strong>Tech Park Gate 2</strong> (Co-Rider: Priya S.)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#18231D] text-white flex items-center justify-center text-[9px] font-bold">4</span>
                <span>Dropoff: <strong>{destLabel}</strong> (You &bull; +4 mins added time)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

