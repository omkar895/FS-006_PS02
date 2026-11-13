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
        if (!session || session.user.email !== "passenger@fairride.demo") {
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

  // Sub-second Realtime WebSockets for Instant Status Updates
  useEffect(() => {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel("passenger-realtime-rides")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "rides" },
          () => {
            fetchRides();
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
    <div className="max-w-7xl mx-auto py-8 px-6">
      <div className="border-b border-[#D6DCD2] pb-4 mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#68746C]">Passenger Portal</span>
          <h1 className="text-2xl font-bold tracking-tight text-[#18231D]">Book & Track Rides</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2.5 py-1 rounded bg-[#EAF2ED] text-[#245A43] border border-[#245A43]/20 font-medium">
            ● Demo Passenger Active
          </span>
          <button
            onClick={fetchRides}
            disabled={loading}
            className="text-xs font-medium px-3 py-1.5 border border-[#D6DCD2] rounded bg-white hover:bg-[#EAECE5] transition-colors"
          >
            {loading ? "Refreshing..." : "Refresh Status"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Booking Form Rail */}
        <div className="lg:col-span-4 bg-white border border-[#D6DCD2] rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#18231D] mb-4">Request a Ride</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-[#B7443E] text-xs rounded">
                {error}
              </div>
            )}

            <div className="mb-4 flex items-center bg-[#F4F3ED] p-1 rounded border border-[#D6DCD2]">
              <button
                type="button"
                onClick={() => setInputMode("search")}
                className={`flex-1 text-xs py-1.5 font-medium rounded transition-colors ${
                  inputMode === "search"
                    ? "bg-white text-[#18231D] shadow-xs border border-[#D6DCD2]"
                    : "text-[#68746C] hover:text-[#18231D]"
                }`}
              >
                📍 Real OSM Search
              </button>
              <button
                type="button"
                onClick={() => setInputMode("preset")}
                className={`flex-1 text-xs py-1.5 font-medium rounded transition-colors ${
                  inputMode === "preset"
                    ? "bg-white text-[#18231D] shadow-xs border border-[#D6DCD2]"
                    : "text-[#68746C] hover:text-[#18231D]"
                }`}
              >
                🏢 Preset Hubs
              </button>
            </div>

            <form onSubmit={handleBookRide} className="space-y-4 text-sm">
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
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="pickup-select" className="block text-xs font-medium text-[#35423A] mb-1">
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
                      className="w-full border border-[#D6DCD2] rounded px-3 py-2 text-xs focus:border-[#245A43] bg-white"
                    >
                      {PRESET_LOCATIONS.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.description})
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-[#68746C] mt-1 block">
                      Coordinates: {pickupLocation.lat.toFixed(4)}, {pickupLocation.lng.toFixed(4)}
                    </span>
                  </div>

                  <div>
                    <label htmlFor="dest-select" className="block text-xs font-medium text-[#35423A] mb-1">
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
                      className="w-full border border-[#D6DCD2] rounded px-3 py-2 text-xs focus:border-[#245A43] bg-white"
                    >
                      {PRESET_LOCATIONS.map((loc) => (
                        <option key={loc.id} value={loc.id} disabled={loc.id === pickupLocation.id}>
                          {loc.name} ({loc.description})
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-[#68746C] mt-1 block">
                      Coordinates: {destLocation.lat.toFixed(4)}, {destLocation.lng.toFixed(4)}
                    </span>
                  </div>
                </>
              )}

              {/* Real Road Route Metrics Pill */}
              <div className="p-2.5 rounded bg-[#F4F3ED] border border-[#D6DCD2] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#68746C] block text-[11px]">Calculated Route</span>
                  <span className="font-semibold text-[#18231D]">
                    {effectiveDistanceKm} km {roadDurationMinutes ? `(~${roadDurationMinutes} mins)` : ""}
                  </span>
                </div>
                {isRealRoad ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#245A43] text-white">
                    🛣️ OSRM Live Road
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                    Straight Line
                  </span>
                )}
              </div>

              <PoolingCard
                isPooled={isPooling}
                onToggle={setIsPooling}
                directFare={directFare}
                pickupLabel={pickupLocation.name}
                destLabel={destLocation.name}
              />

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full bg-[#245A43] hover:bg-[#1b4332] text-white py-2.5 px-4 rounded font-medium text-sm transition-colors disabled:opacity-50"
                >
                  {bookingLoading
                    ? "Calculating & Dispatching..."
                    : isPooling
                    ? `Request Pooled Ride (₹${Math.round(directFare * 0.8)})`
                    : `Request Ride Now (₹${directFare})`}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 border-t border-[#D6DCD2] pt-4 text-xs text-[#68746C]">
            <span className="font-semibold text-[#18231D]">
              {isRealRoad ? "OSRM Live Road Navigation:" : "Straight-line Estimate:"}
            </span>{" "}
            {isRealRoad
              ? "Routing follows actual road geometry and turns using Open Source Routing Machine."
              : "Distance calculated via Haversine. Indicative ETA assumes 30 km/h baseline without live traffic promises."}
          </div>
        </div>

        {/* Map & Live Discovery Center */}
        <div className="lg:col-span-8 space-y-6">
          {/* Operations Map */}
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
            drivers={nearbyDrivers.map((d) => ({
              id: d.userId,
              lat: d.lat,
              lng: d.lng,
              label: `${d.vehicleLabel} (${d.distanceKm} km)`,
              eta: d.estimatedPickupMinutes,
            }))}
            height="380px"
          />

          {/* Active Ride or Live Nearby List */}
          {activeRide ? (
            <div className="border border-[#245A43] bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#245A43]">
                  Active Ride in Progress
                </span>
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#EAECE5] text-[#18231D] uppercase">
                  {activeRide.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#D6DCD2] text-center text-xs">
                <div>
                  <span className="text-[#68746C] block">Straight-line Distance</span>
                  <span className="font-bold text-[#18231D] text-sm">{activeRide.distance_km} km</span>
                </div>
                <div>
                  <span className="text-[#68746C] block">Estimated Fare</span>
                  <span className="font-bold text-[#245A43] text-sm">₹{activeRide.fare_estimate}</span>
                </div>
                <div>
                  <span className="text-[#68746C] block">Indicative ETA</span>
                  <span className="font-bold text-[#18231D] text-sm">{activeRide.trip_eta_minutes || "--"} mins</span>
                </div>
              </div>

              {/* Pitch Feature 1: Why This Driver? Explainability */}
              <MatchExplanationCard
                metadata={activeRide.match_metadata}
                assignedDriverId={activeRide.assigned_driver_id}
                pickupEtaMinutes={activeRide.pickup_eta_minutes}
              />

              {/* Pitch Feature 2: Solo Presenter Lifecycle Simulator */}
              <LifecycleSimulator
                rideId={activeRide.id}
                currentStatus={activeRide.status}
                onRefresh={fetchRides}
              />
            </div>
          ) : (
            <div className="bg-white border border-[#D6DCD2] rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#35423A]">
                  Nearby Available Drivers Projection ({nearbyDrivers.length} Available)
                </h3>
                <span className="text-[11px] text-[#68746C] bg-[#EAECE5] px-2 py-0.5 rounded">
                  SIMULATED TELEMETRY
                </span>
              </div>

              {nearbyDrivers.length === 0 ? (
                <p className="text-xs text-[#68746C]">No available drivers nearby within 15 mins radius.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {nearbyDrivers.slice(0, 4).map((d) => (
                    <div key={d.userId} className="border border-[#D6DCD2] rounded p-2.5 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-[#18231D] block">{d.vehicleLabel}</span>
                        <span className="text-[#68746C]">{d.distanceKm} km away</span>
                      </div>
                      <span className="font-bold text-[#245A43] bg-[#F4F3ED] px-2 py-1 rounded border border-[#D6DCD2]">
                        ~{d.estimatedPickupMinutes}m pickup
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ride History */}
          <div className="bg-white border border-[#D6DCD2] rounded-lg p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#35423A] mb-3">
              Recent Ride History
            </h3>
            {rides.length === 0 ? (
              <p className="text-xs text-[#68746C]">No ride history records found.</p>
            ) : (
              <div className="divide-y divide-[#D6DCD2]">
                {rides.slice(0, 3).map((ride) => (
                  <div key={ride.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-[#18231D]">{ride.pickup_label} &rarr; {ride.destination_label}</div>
                      <div className="text-[#68746C]">
                        {new Date(ride.requested_at).toLocaleTimeString()} &middot; {ride.distance_km} km &middot; ₹{ride.fare_estimate}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded font-medium uppercase border border-[#D6DCD2] text-[#35423A]">
                      {ride.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
