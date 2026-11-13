"use client";

import React, { useState, useEffect } from "react";
import { Ride } from "@/lib/schemas/database";
import OperationsMap from "@/components/maps/map-wrapper";
import { PRESET_LOCATIONS, PresetLocation } from "@/lib/utils/demo-locations";
import { createClient } from "@/lib/auth/client";
import MatchExplanationCard from "@/components/dispatch/match-explanation-card";
import LifecycleSimulator from "@/components/dispatch/lifecycle-simulator";
import PoolingCard from "@/components/dispatch/pooling-card";
import LocationSearchInput from "@/components/maps/location-search-input";
import { fetchRealRoadRoute } from "@/lib/services/routing-service";
import { findNearestMetroStation } from "@/lib/utils/metro-stations";

interface NearbyDriver {
  userId: string;
  vehicleLabel: string;
  lat: number;
  lng: number;
  distanceKm: number;
  estimatedPickupMinutes: number;
}

export default function PassengerWorkspace() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected locations
  const [pickupLocation, setPickupLocation] = useState<PresetLocation>(PRESET_LOCATIONS[0]);
  const [destLocation, setDestLocation] = useState<PresetLocation>(PRESET_LOCATIONS[1]);
  const [isPooling, setIsPooling] = useState(false);
  const [inputMode, setInputMode] = useState<"search" | "preset">("preset");

  // Real road route state
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [isRealRoad, setIsRealRoad] = useState(false);
  const [roadDistanceKm, setRoadDistanceKm] = useState<number | null>(null);
  const [roadDurationMinutes, setRoadDurationMinutes] = useState<number | null>(null);

  // Live Assigned Driver Realtime Moving Location
  const [assignedDriverCoords, setAssignedDriverCoords] = useState<{
    lat: number;
    lng: number;
    label: string;
    eta?: number;
  } | null>(null);

  // Instant Realtime Notification Toast
  const [realtimeToast, setRealtimeToast] = useState<{
    message: string;
    type: "info" | "success" | "warning";
  } | null>(null);

  const [shareCopied, setShareCopied] = useState(false);

  // Passenger Profile & Account Settings State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("Demo Passenger");
  const [profilePhone, setProfilePhone] = useState("+91 98765 43210");
  const [ecoDefault, setEcoDefault] = useState(true);
  const [homeAddress, setHomeAddress] = useState("Koramangala 4th Block, Bengaluru");
  const [workAddress, setWorkAddress] = useState("Manyata Tech Park, Nagawara, Bengaluru");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: profileName }),
      });
      if (res.ok) {
        setProfileMessage("Profile updated successfully!");
        setTimeout(() => setProfileMessage(null), 3000);
      } else {
        setProfileMessage("Profile updated locally.");
      }
    } catch {
      setProfileMessage("Saved changes locally.");
    } finally {
      setProfileSaving(false);
    }
  };

  const speakMilestone = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback
      }
    }
  };

  // Dynamic fare estimate (prioritizing real road distance when available)
  const effectiveDistanceKm = roadDistanceKm ?? Number(
    Math.hypot(
      (destLocation.lat - pickupLocation.lat) * 111,
      (destLocation.lng - pickupLocation.lng) * 85
    ).toFixed(2)
  );
  const directFare = Math.max(50, Math.round(50 + effectiveDistanceKm * 15));

  const fetchRides = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rides");
      if (res.ok) {
        const json = await res.json();
        setRides(json.data || []);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          await supabase.auth.signInWithPassword({
            email: "passenger@fairride.demo",
            password: "DemoPassword123!",
          });
        }
      } catch {
        // Fallback for tests or offline
      }

      try {
        const res = await fetch("/api/rides");
        if (res.ok && !ignore) {
          const json = await res.json();
          setRides(json.data || []);
        }
      } catch {
        // Offline
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  // Sub-second Realtime WebSockets for Instant Status Updates & Driver Telemetry
  useEffect(() => {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel("passenger-realtime-sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "rides" },
          (payload) => {
            fetchRides();
            if (payload.eventType === "UPDATE" && payload.new) {
              const newStatus = (payload.new as { status: string }).status;
              if (newStatus === "accepted") {
                speakMilestone("Driver accepted your ride and is en route.");
                setRealtimeToast({
                  message: "🎉 Driver Accepted! Driver Alpha is en route to your pickup point.",
                  type: "success",
                });
              } else if (newStatus === "arriving") {
                speakMilestone("Your driver has arrived at the pickup location.");
                setRealtimeToast({
                  message: "🚖 Driver Arriving! Your driver has reached the pickup location.",
                  type: "info",
                });
              } else if (newStatus === "ongoing") {
                speakMilestone("Trip has started. Live navigation active.");
                setRealtimeToast({
                  message: "🛣️ Trip Underway! Live vehicle telemetry streaming on road.",
                  type: "info",
                });
              } else if (newStatus === "completed") {
                speakMilestone("Trip completed safely. Thank you for riding green with Go-Fair.");
                setRealtimeToast({
                  message: "🏁 Trip Completed! Thank you for riding with Go-Fair.",
                  type: "success",
                });
              } else if (newStatus === "reassigning") {
                speakMilestone("Initial driver unavailable. Automatically reassigning to next best driver.");
                setRealtimeToast({
                  message: "🔄 Driver Unavailable: Reassigning to next best eligible driver automatically.",
                  type: "warning",
                });
              }
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "driver_profiles" },
          (payload) => {
            const row = payload.new as {
              user_id: string;
              current_lat: number;
              current_lng: number;
              vehicle_label?: string;
            };
            if (row && row.current_lat && row.current_lng) {
              setAssignedDriverCoords({
                lat: row.current_lat,
                lng: row.current_lng,
                label: row.vehicle_label || "Active Driver",
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Fallback
    }
  }, []);

  // Real-world OSRM driving road routing
  useEffect(() => {
    let ignore = false;
    async function loadRoute() {
      const route = await fetchRealRoadRoute(
        pickupLocation.lat,
        pickupLocation.lng,
        destLocation.lat,
        destLocation.lng
      );
      if (!ignore) {
        setRouteCoordinates(route.coordinates);
        setIsRealRoad(route.isRealRoad);
        setRoadDistanceKm(route.distanceKm);
        setRoadDurationMinutes(route.durationMinutes);
      }
    }
    loadRoute();
    return () => {
      ignore = true;
    };
  }, [pickupLocation.lat, pickupLocation.lng, destLocation.lat, destLocation.lng]);

  useEffect(() => {
    let ignore = false;
    async function loadNearby() {
      try {
        const res = await fetch(`/api/drivers/nearby?lat=${pickupLocation.lat}&lng=${pickupLocation.lng}`);
        if (res.ok && !ignore) {
          const json = await res.json();
          setNearbyDrivers(json.data || []);
        }
      } catch {
        // Fallback
      }
    }
    loadNearby();
    return () => {
      ignore = true;
    };
  }, [pickupLocation]);

  const handleBookRide = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup: {
            label: pickupLocation.name,
            lat: pickupLocation.lat,
            lng: pickupLocation.lng,
          },
          destination: {
            label: destLocation.name,
            lat: destLocation.lat,
            lng: destLocation.lng,
          },
          idempotencyKey: crypto.randomUUID(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to book ride");
      }

      await fetchRides();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating ride request");
    } finally {
      setBookingLoading(false);
    }
  };

  const activeRide = rides.find((r) =>
    ["requested", "accepted", "arriving", "ongoing"].includes(r.status)
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Header */}
      <div className="border-b border-zinc-200/90 pb-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Passenger Operations Terminal
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">Book & Track Rides</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="text-xs px-3.5 py-2 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black">
              DP
            </span>
            <span>Profile &amp; Settings</span>
          </button>
          <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Demo Passenger Active
          </span>
          <button
            onClick={fetchRides}
            disabled={loading}
            className="text-xs font-semibold px-4 py-2 border border-zinc-200 rounded-full bg-white hover:bg-zinc-50 text-zinc-800 transition-all shadow-xs disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Status"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Booking Form Rail */}
        <div className="lg:col-span-5 bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold tracking-tight text-zinc-950">Request a Ride</h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700">
                PS2 Fair Dispatch
              </span>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            {/* Input Mode Switcher */}
            <div className="mb-5 flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200/70">
              <button
                type="button"
                onClick={() => setInputMode("search")}
                className={`flex-1 text-xs py-2 font-bold rounded-lg transition-all ${
                  inputMode === "search"
                    ? "bg-white text-zinc-950 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                📍 Real OSM Search
              </button>
              <button
                type="button"
                onClick={() => setInputMode("preset")}
                className={`flex-1 text-xs py-2 font-bold rounded-lg transition-all ${
                  inputMode === "preset"
                    ? "bg-white text-zinc-950 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                🏢 Preset Hubs
              </button>
            </div>

            <form onSubmit={handleBookRide} className="space-y-5 text-sm">
              {/* Connected Route Timeline Container (Uber/Ola Style) */}
              <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-4 relative">
                <div className="flex items-stretch gap-3">
                  {/* Left Timeline Indicator */}
                  <div className="flex flex-col items-center justify-between py-2 shrink-0">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-600 bg-white flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    </div>
                    <div className="w-0.5 flex-1 bg-zinc-300 my-1"></div>
                    <div className="w-3.5 h-3.5 bg-zinc-950 rounded-xs flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-white rounded-xs"></span>
                    </div>
                  </div>

                  {/* Right Input Fields */}
                  <div className="flex-1 space-y-3">
                    {inputMode === "search" ? (
                      <>
                        <LocationSearchInput
                          label="Pickup Location (Search Live Map)"
                          placeholder="Search e.g. Indiranagar, MG Road, Airport..."
                          currentName={pickupLocation.name}
                          onSelectPlace={(place) =>
                            setPickupLocation({
                              id: `osm-${Date.now()}-pickup`,
                              name: place.name,
                              category: "commercial",
                              lat: place.lat,
                              lng: place.lng,
                              description: "Real OSM Location",
                            })
                          }
                        />

                        <div className="border-t border-zinc-200/70 pt-2">
                          <LocationSearchInput
                            label="Destination Location (Search Live Map)"
                            placeholder="Search e.g. Koramangala, Whitefield, HSR..."
                            currentName={destLocation.name}
                            onSelectPlace={(place) =>
                              setDestLocation({
                                id: `osm-${Date.now()}-dest`,
                                name: place.name,
                                category: "commercial",
                                lat: place.lat,
                                lng: place.lng,
                                description: "Real OSM Location",
                              })
                            }
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label htmlFor="pickup-select" className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                            Pickup Location (Demo Presets)
                          </label>
                          <select
                            id="pickup-select"
                            aria-label="Pickup Location"
                            value={pickupLocation.id}
                            onChange={(e) => {
                              const loc = PRESET_LOCATIONS.find((l) => l.id === e.target.value);
                              if (loc) setPickupLocation(loc);
                            }}
                            className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-black focus:border-black bg-white text-zinc-900 transition-all"
                          >
                            {PRESET_LOCATIONS.map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name} ({loc.description})
                              </option>
                            ))}
                          </select>
                          <span className="text-[10px] text-zinc-500 mt-1 block">
                            Coordinates: {pickupLocation.lat.toFixed(4)}, {pickupLocation.lng.toFixed(4)}
                          </span>
                        </div>

                        <div className="border-t border-zinc-200/70 pt-2">
                          <label htmlFor="dest-select" className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                            Destination Location (Demo Presets)
                          </label>
                          <select
                            id="dest-select"
                            aria-label="Destination Location"
                            value={destLocation.id}
                            onChange={(e) => {
                              const loc = PRESET_LOCATIONS.find((l) => l.id === e.target.value);
                              if (loc) setDestLocation(loc);
                            }}
                            className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-black focus:border-black bg-white text-zinc-900 transition-all"
                          >
                            {PRESET_LOCATIONS.map((loc) => (
                              <option key={loc.id} value={loc.id} disabled={loc.id === pickupLocation.id}>
                                {loc.name} ({loc.description})
                              </option>
                            ))}
                          </select>
                          <span className="text-[10px] text-zinc-500 mt-1 block">
                            Coordinates: {destLocation.lat.toFixed(4)}, {destLocation.lng.toFixed(4)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Calculated Route Strip */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-500 block text-[11px] font-medium">Calculated Route</span>
                  <span className="font-bold text-zinc-900">
                    {effectiveDistanceKm} km {roadDurationMinutes ? `(~${roadDurationMinutes} mins)` : ""}
                  </span>
                </div>
                {isRealRoad ? (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white flex items-center gap-1">
                    <span>🛣️</span>
                    <span>OSRM Live Road</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700">
                    Straight Line
                  </span>
                )}
              </div>

              {/* Ride Options / Tier Selector (Uber Style) */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
                  Select Ride Tier
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Tier 1: Go-Fair Prime */}
                  <div
                    onClick={() => setIsPooling(false)}
                    className={`cursor-pointer p-3 rounded-2xl border transition-all ${
                      !isPooling
                        ? "border-black bg-zinc-900 text-white shadow-sm"
                        : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">🚗</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        !isPooling ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
                      }`}>
                        4 seats
                      </span>
                    </div>
                    <div className="font-extrabold text-xs">Go-Fair Prime</div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200/20">
                      <span className={`text-[11px] font-bold ${!isPooling ? "text-emerald-400" : "text-emerald-700"}`}>
                        ₹{directFare}
                      </span>
                      <span className={`text-[10px] ${!isPooling ? "text-zinc-300" : "text-zinc-500"}`}>
                        ~3 mins away
                      </span>
                    </div>
                  </div>

                  {/* Tier 2: Go-Fair Eco-Pool */}
                  <div
                    onClick={() => setIsPooling(true)}
                    className={`cursor-pointer p-3 rounded-2xl border transition-all ${
                      isPooling
                        ? "border-emerald-600 bg-emerald-950 text-white shadow-sm ring-1 ring-emerald-500"
                        : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">🌱</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300">
                        Save 20%
                      </span>
                    </div>
                    <div className="font-extrabold text-xs">Go-Fair Eco-Pool</div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200/20">
                      <span className="text-[11px] font-bold text-emerald-400">
                        ₹{Math.round(directFare * 0.8)}
                      </span>
                      <span className={`text-[10px] ${isPooling ? "text-emerald-200" : "text-zinc-500"}`}>
                        -1.8kg CO₂
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pooling Details Drawer */}
              <PoolingCard
                isPooled={isPooling}
                onToggle={setIsPooling}
                directFare={directFare}
                pickupLabel={pickupLocation.name}
                destLabel={destLocation.name}
              />

              {/* Uber/Ola Style Big Black Tactile CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full bg-zinc-950 hover:bg-zinc-800 active:scale-[0.99] text-white py-3.5 px-5 rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-between disabled:opacity-50"
                >
                  <span>
                    {bookingLoading
                      ? "Calculating & Dispatching..."
                      : isPooling
                      ? `Request Pooled Ride (₹${Math.round(directFare * 0.8)})`
                      : `Request Ride Now (₹${directFare})`}
                  </span>
                  <span className="text-base">→</span>
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 border-t border-zinc-200 pt-4 text-[11px] text-zinc-500 leading-relaxed">
            <span className="font-bold text-zinc-800">
              {isRealRoad ? "OSRM Live Road Navigation:" : "Straight-line Estimate:"}
            </span>{" "}
            {isRealRoad
              ? "Routing follows actual road geometry and turns using Open Source Routing Machine."
              : "Distance calculated via Haversine. Indicative ETA assumes 30 km/h baseline without live traffic promises."}
          </div>
        </div>

        {/* Map & Live Discovery Center */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Realtime Event Toast Banner */}
          {realtimeToast && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-sm animate-in fade-in slide-in-from-top duration-300 ${
                realtimeToast.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                  : "bg-blue-50 text-blue-900 border-blue-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                <span>{realtimeToast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setRealtimeToast(null)}
                className="text-sm font-bold opacity-60 hover:opacity-100"
              >
                &times;
              </button>
            </div>
          )}

          {/* Operations Map Surface */}
          <div className="rounded-3xl overflow-hidden border border-zinc-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white">
            <OperationsMap
              pickup={{
                lat: pickupLocation.lat,
                lng: pickupLocation.lng,
                label: pickupLocation.name,
              }}
              destination={{
                lat: destLocation.lat,
                lng: destLocation.lng,
                label: destLocation.name,
              }}
              routeCoordinates={routeCoordinates}
              isRealRoad={isRealRoad}
              activeDriver={activeRide ? assignedDriverCoords : null}
              drivers={nearbyDrivers.map((d) => ({
                id: d.userId,
                lat: d.lat,
                lng: d.lng,
                label: `${d.vehicleLabel} (${d.distanceKm} km)`,
                eta: d.estimatedPickupMinutes,
              }))}
              height="390px"
            />
          </div>

          {/* Active Ride Card (Uber/Ola Live Tracking Experience) */}
          {activeRide ? (
            <div className="border border-zinc-200/90 bg-white rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-5">
              {/* Top Status & Ride PIN Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                      Active Trip in Progress
                    </span>
                    <span className="text-sm font-extrabold uppercase text-zinc-950">
                      {activeRide.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Uber-style Safety PIN */}
                <div className="bg-zinc-900 text-white px-3.5 py-1.5 rounded-xl text-right shadow-xs">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 block font-semibold">
                    RIDE PIN / OTP
                  </span>
                  <span className="text-sm font-black tracking-widest text-emerald-400">4829</span>
                </div>
              </div>

              {/* Driver & Vehicle Identity Card */}
              <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      DA
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-amber-400 text-zinc-950 text-[10px] font-black px-1 rounded-full shadow-xs">
                      ★ 4.9
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <span>Driver Alpha</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        Verified
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-medium">Swift Dzire Prime (White)</span>
                  </div>
                </div>

                {/* Monospace License Plate Badge */}
                <div className="bg-white border-2 border-zinc-900 text-zinc-950 px-3 py-1 rounded-lg font-mono font-black text-xs tracking-wider shadow-xs">
                  KA-01-EQ-4491
                </div>
              </div>

              {/* Trip Key Stats */}
              <div className="grid grid-cols-3 gap-3 py-3 border-y border-zinc-200 text-center">
                <div>
                  <span className="text-zinc-500 block text-[11px] font-medium">Distance</span>
                  <span className="font-extrabold text-zinc-950 text-base">{activeRide.distance_km} km</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px] font-medium">Total Fare</span>
                  <span className="font-extrabold text-emerald-600 text-base">₹{activeRide.fare_estimate}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px] font-medium">Indicative ETA</span>
                  <span className="font-extrabold text-zinc-950 text-base">{activeRide.trip_eta_minutes || "--"} mins</span>
                </div>
              </div>

              {/* Explainability Card */}
              <MatchExplanationCard
                metadata={activeRide.match_metadata}
                assignedDriverId={activeRide.assigned_driver_id}
                pickupEtaMinutes={activeRide.pickup_eta_minutes}
              />

              {/* Public Live Trip Tracking Link */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-sm shadow-xs">
                    🔗
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-900 block">Public Live Trip Tracking</span>
                    <span className="text-[11px] text-zinc-500">Share real-time moving map with friends or family</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        navigator.clipboard.writeText(`${window.location.origin}/trip/${activeRide.id}`);
                        setShareCopied(true);
                        setTimeout(() => setShareCopied(false), 2500);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 transition-all shadow-xs"
                  >
                    {shareCopied ? "✓ Copied" : "Copy Link"}
                  </button>
                  <a
                    href={`/trip/${activeRide.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>Track Live</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>

              {/* Green Mobility Impact Counter */}
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🌱</span>
                  <div>
                    <span className="font-extrabold text-emerald-950">Green Mobility Impact</span>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Saved ~{(activeRide.distance_km * 0.17).toFixed(1)} kg CO₂ & avoided {(activeRide.distance_km * 0.4).toFixed(1)} km empty vehicle cruising.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2.5 py-1 rounded-full shrink-0 shadow-xs">
                  PS2 ECO-CREDIT
                </span>
              </div>

              {/* Multi-Modal Hub Connection */}
              {(() => {
                const metro = findNearestMetroStation(activeRide.pickup_lat, activeRide.pickup_lng);
                return (
                  <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🚆</span>
                      <div>
                        <span className="font-bold text-purple-950">
                          Multi-Modal Metro Link: ~{metro.transitMinutes} mins to {metro.station.name}
                        </span>
                        <span className="text-[11px] text-purple-800 block mt-0.5">
                          {metro.station.line} &bull; {metro.distanceKm} km first-mile connection
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-purple-700 text-white font-bold px-2.5 py-1 rounded-full shrink-0">
                      NAMMA METRO
                    </span>
                  </div>
                );
              })()}

              {/* Lifecycle Simulator */}
              <LifecycleSimulator
                rideId={activeRide.id}
                currentStatus={activeRide.status}
                onRefresh={fetchRides}
              />
            </div>
          ) : (
            <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Nearby Available Drivers Projection ({nearbyDrivers.length} Available)
                </h3>
                <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-full">
                  SIMULATED TELEMETRY
                </span>
              </div>

              {nearbyDrivers.length === 0 ? (
                <p className="text-xs text-zinc-500">No available drivers nearby within 15 mins radius.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {nearbyDrivers.slice(0, 4).map((d) => (
                    <div key={d.userId} className="border border-zinc-200 rounded-2xl p-3.5 text-xs flex justify-between items-center hover:border-zinc-300 transition-all bg-zinc-50/50">
                      <div>
                        <span className="font-bold text-zinc-950 block">{d.vehicleLabel}</span>
                        <span className="text-zinc-500">{d.distanceKm} km away</span>
                      </div>
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        ~{d.estimatedPickupMinutes}m pickup
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ride History */}
          <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">
              Recent Ride History
            </h3>
            {rides.length === 0 ? (
              <p className="text-xs text-zinc-500">No ride history records found.</p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {rides.slice(0, 3).map((ride) => (
                  <div key={ride.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-zinc-900">{ride.pickup_label} &rarr; {ride.destination_label}</div>
                      <div className="text-zinc-500 text-[11px] mt-0.5">
                        {new Date(ride.requested_at).toLocaleTimeString()} &middot; {ride.distance_km} km &middot; ₹{ride.fare_estimate}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full font-bold uppercase text-[10px] bg-zinc-100 text-zinc-800">
                      {ride.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Passenger Profile & Settings Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-zinc-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-base font-black shadow-xs">
                  {profileName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "DP"}
                </div>
                <div>
                  <h2 className="text-lg font-black text-zinc-950">Passenger Profile</h2>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ● Urban Rider Account
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {profileMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl font-bold">
                ✓ {profileMessage}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-900 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  placeholder="Your full name"
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-900 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-900 mb-1">Registered Email</label>
                <input
                  type="email"
                  disabled
                  value="passenger@fairride.demo"
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl bg-zinc-100 text-zinc-500 font-mono text-xs cursor-not-allowed"
                />
              </div>

              {/* Saved Hub Addresses */}
              <div className="border-t border-zinc-200/80 pt-3 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
                  Quick Saved Locations
                </span>
                <div>
                  <label className="block font-bold text-zinc-800 mb-1">🏠 Home Address</label>
                  <input
                    type="text"
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl bg-white text-zinc-900 text-xs focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-800 mb-1">🏢 Work Address</label>
                  <input
                    type="text"
                    value={workAddress}
                    onChange={(e) => setWorkAddress(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl bg-white text-zinc-900 text-xs focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Eco Pooling Default Toggle */}
              <div className="border-t border-zinc-200/80 pt-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-900 block">Default to Green Pooling</span>
                  <span className="text-[11px] text-zinc-500">Auto-select eco-shared rides to reduce city carbon</span>
                </div>
                <input
                  type="checkbox"
                  checked={ecoDefault}
                  onChange={(e) => setEcoDefault(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded accent-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex-1 py-3 px-4 border border-zinc-200 text-zinc-700 font-bold rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="flex-1 py-3 px-4 bg-black hover:bg-zinc-800 text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
                >
                  {profileSaving ? "Saving Changes..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
