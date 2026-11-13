"use client";

import dynamic from "next/dynamic";

const OperationsMap = dynamic(
  () => import("@/components/maps/operations-map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] w-full bg-[#EAECE5] rounded-lg border border-[#D6DCD2] flex flex-col items-center justify-center text-xs text-[#68746C] animate-pulse">
        <span className="font-medium text-[#18231D] mb-1">Loading Operations Surface...</span>
        <span>OpenStreetMap tiles & Leaflet viewport</span>
      </div>
    ),
  }
);

export default OperationsMap;
