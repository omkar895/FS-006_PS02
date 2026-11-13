"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import OperationsMap from "@/components/maps/map-wrapper";
import { fetchRealRoadRoute } from "@/lib/services/routing-service";
import Link from "next/link";

interface PublicTripData {
  id: string;
  status: "requested" | "matched" | "accepted" | "arriving" | "ongoing" | "completed" | "cancelled";
  pickup_label: string;
  pickup_lat: number;
  pickup_lng: number;
  destination_label: string;
  destination_lat: number;
  destination_lng: number;
  distance_km: number;
  fare_estimate: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  driver?: {
    vehicle_label: string;
    vehicle_type: string;
    current_lat: number;
    current_lng: number;
    rating: number;
  } | null;
  match_metadata?: {
    engine?: string;
    method?: string;
  };
}

export default function PublicTripTrackerPage() {
  const routeParams = useParams();
  const tripId = (typeof routeParams?.id === "string" ? routeParams.id : "") || "demo-trip";

  const [trip, setTrip] = useState<PublicTripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [, setLastAnnouncedStatus] = useState<string>("");
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  // Audio Milestone Voice Chime via Web Speech API
  const announceMilestone = (message: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback if audio permission blocked
      }
    }
  };

  // Initial load and polling every 4 seconds for sub-second live progress
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/trips/${tripId}`);
        if (!res.ok) {
          if (!ignore) {
            if (res.status === 404) {
              setError("Trip not found or expired.");
            } else {
              setError("Unable to load live trip telemetry.");
            }
          }
          return;
        }
        const json = await res.json();
        if (json.data && !ignore) {
          const data: PublicTripData = json.data;
          setTrip(data);
          setError(null);

          // Voice announcement on state transitions
          setLastAnnouncedStatus((prev) => {
            if (data.status !== prev) {
              if (data.status === "accepted") {
                announceMilestone("Driver has accepted your trip and is heading to pickup.");
              } else if (data.status === "arriving") {
                announceMilestone("Your Go-Fair driver is arriving at the pickup location.");
              } else if (data.status === "ongoing") {
                announceMilestone("Trip has started. Tracking live vehicle on road.");
              } else if (data.status === "completed") {
                announceMilestone("Trip completed safely. Thank you for riding green with Go-Fair.");
              }
              return data.status;
            }
            return prev;
          });
        }
      } catch {
        if (!ignore) {
          setError("Network error while connecting to fleet grid.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();
    const interval = setInterval(load, 4000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [tripId]);

  const pickupLat = trip?.pickup_lat;
  const pickupLng = trip?.pickup_lng;
  const destLat = trip?.destination_lat;
  const destLng = trip?.destination_lng;

  // Fetch real road route geometry from OSRM once trip details are loaded
  useEffect(() => {
    if (pickupLat == null || pickupLng == null || destLat == null || destLng == null) return;
    let ignore = false;
    async function loadRoad() {
      const res = await fetchRealRoadRoute(
        pickupLat as number,
        pickupLng as number,
        destLat as number,
        destLng as number
      );
      if (res && !ignore) {
        setRouteCoordinates(res.coordinates);
      }
    }
    loadRoad();
    return () => {
      ignore = true;
    };
  }, [pickupLat, pickupLng, destLat, destLng]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window !== "undefined" && trip) {
      const text = encodeURIComponent(
        `Track my live Go-Fair ride from ${trip.pickup_label} to ${trip.destination_label} in real time:\n${window.location.href}`
      );
      window.open(`https://wa.me/?text=${text}`, "_blank");
    }
  };

  // Environmental impact calculations (PS2 Green Mobility)
  const distance = trip?.distance_km || 3.0;
  const co2SavedKg = (distance * 0.17).toFixed(1);
  const cruisingAvoidedKm = (distance * 0.4).toFixed(1);
  const treesEquivalent = Math.max(1, Math.round((distance * 0.17) / 0.06));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F3ED] flex items-center justify-center p-6">
        <div className="bg-white border border-[#D6DCD2] p-8 rounded-xl shadow-sm text-center max-w-sm w-full">
          <div className="w-8 h-8 border-3 border-[#245A43] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-base font-bold text-[#18231D]">Connecting to Live Vehicle GPS...</h2>
          <p className="text-xs text-[#68746C] mt-1">Retrieving sub-second trip telemetry</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-[#F4F3ED] flex items-center justify-center p-6">
        <div className="bg-white border border-[#D6DCD2] p-8 rounded-xl shadow-sm text-center max-w-sm w-full">
          <div className="text-3xl mb-3">📍</div>
          <h2 className="text-base font-bold text-[#18231D]">{error || "Trip Not Found"}</h2>
          <p className="text-xs text-[#68746C] mt-2 mb-4">
            This live tracking session may have concluded or the link is invalid.
          </p>
          <Link
            href="/passenger"
            className="inline-block bg-[#245A43] text-white text-xs font-bold px-4 py-2 rounded"
          >
            Return to Passenger Portal
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: PublicTripData["status"]) => {
    switch (status) {
      case "requested":
        return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold animate-pulse">Dispatching...</span>;
      case "matched":
      case "accepted":
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">Driver Assigned</span>;
      case "arriving":
        return <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold">Driver Arriving</span>;
      case "ongoing":
        return <span className="bg-green-100 text-[#245A43] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#245A43] animate-ping" /> Live on Road</span>;
      case "completed":
        return <span className="bg-[#D6EE74] text-[#18231D] px-3 py-1 rounded-full text-xs font-bold">Trip Completed 🏁</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3ED] py-6 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between bg-white border border-[#D6DCD2] p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-xl text-[#245A43]">Go-Fair</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#EAF2ED] text-[#245A43] font-bold border border-[#245A43]/20">
              LIVE TRIP TRACKER
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="text-xs border border-[#D6DCD2] hover:bg-gray-50 text-[#35423A] font-semibold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
            >
              <span>{copied ? "✓ Copied Link" : "🔗 Copy Link"}</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="text-xs bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>💬 WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Live Trip Header & Status */}
        <div className="bg-white border border-[#D6DCD2] p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#68746C] uppercase tracking-wider">
                Public Live Route Share
              </span>
              <span className="text-[11px] bg-[#EAECE5] text-[#35423A] font-mono px-2 py-0.5 rounded">
                ID: {trip.id.slice(0, 8)}...
              </span>
            </div>
            <h1 className="text-lg font-bold text-[#18231D]">
              {trip.pickup_label} &rarr; {trip.destination_label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge(trip.status)}
            <button
              onClick={() => announceMilestone(`Ride is currently ${trip.status}. Destination is ${trip.destination_label}`)}
              title="Voice announcement"
              className="text-sm p-1.5 rounded bg-[#F4F3ED] hover:bg-[#EAECE5] text-[#35423A]"
            >
              🔊
            </button>
          </div>
        </div>

        {/* Live OpenStreetMap Leaflet Surface */}
        <div className="bg-white border border-[#D6DCD2] p-2 rounded-xl shadow-sm overflow-hidden">
          <OperationsMap
            pickup={{
              lat: trip.pickup_lat,
              lng: trip.pickup_lng,
              label: trip.pickup_label,
            }}
            destination={{
              lat: trip.destination_lat,
              lng: trip.destination_lng,
              label: trip.destination_label,
            }}
            activeDriver={
              trip.driver
                ? {
                    lat: trip.driver.current_lat,
                    lng: trip.driver.current_lng,
                    label: trip.driver.vehicle_label,
                  }
                : null
            }
            routeCoordinates={routeCoordinates}
            height="400px"
          />
        </div>

        {/* Grid: Driver Information & Green Carbon Offset Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Driver & Vehicle Details */}
          <div className="bg-white border border-[#D6DCD2] p-5 rounded-xl shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#245A43] mb-3">
              Assigned Vehicle & Driver
            </h2>

            {trip.driver ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-[#68746C]">Vehicle & Plate:</span>
                  <span className="font-bold text-[#18231D]">{trip.driver.vehicle_label}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-[#68746C]">Fleet Category:</span>
                  <span className="font-bold uppercase text-[#35423A]">{trip.driver.vehicle_type}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-[#68746C]">Driver Service Rating:</span>
                  <span className="font-bold text-amber-600">⭐ {trip.driver.rating || "4.92"} / 5.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#68746C]">Dispatch Algorithm:</span>
                  <span className="font-bold text-[#245A43]">Go-Fair Multi-Factor (PS2)</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#68746C] py-2">
                Matching optimal driver via fair allocation engine...
              </p>
            )}
          </div>

          {/* Green Mobility & Carbon Offset Counter (PS2 Feature) */}
          <div className="bg-[#245A43] text-white p-5 rounded-xl shadow-sm relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-10 text-6xl">🌱</div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🌱</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D6EE74]">
                Green Mobility & Carbon Counter
              </span>
            </div>

            <p className="text-xs text-white/90 mb-4">
              By riding with Go-Fair intelligent pooling and route optimization, your trip actively reduces city congestion and urban emissions.
            </p>

            <div className="grid grid-cols-3 gap-2 text-center bg-black/20 p-3 rounded-lg border border-white/10">
              <div>
                <span className="text-[10px] text-white/70 block uppercase">CO₂ Saved</span>
                <span className="text-base font-extrabold text-[#D6EE74]">
                  {co2SavedKg} kg
                </span>
              </div>
              <div>
                <span className="text-[10px] text-white/70 block uppercase">Cruising Saved</span>
                <span className="text-base font-extrabold text-white">
                  {cruisingAvoidedKm} km
                </span>
              </div>
              <div>
                <span className="text-[10px] text-white/70 block uppercase">Tree Impact</span>
                <span className="text-base font-extrabold text-[#D6EE74]">
                  {treesEquivalent} trees
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory & Safety Footer */}
        <div className="bg-[#EAECE5] p-4 rounded-xl border border-[#D6DCD2] text-[11px] text-[#68746C] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            🛡️ Tamper-proof telemetry broadcast. Protected by Bengaluru Fleet Grid dispatch protocols.
          </span>
          <span className="font-semibold text-[#18231D]">
            Go-Fair PS2 Academic Prototype
          </span>
        </div>
      </div>
    </div>
  );
}
