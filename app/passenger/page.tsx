"use client";

import React, { useState, useEffect } from "react";
import { Ride } from "@/lib/schemas/database";

export default function PassengerWorkspace() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form inputs
  const [pickupLabel, setPickupLabel] = useState("Downtown Central Hub");
  const [pickupLat, setPickupLat] = useState("12.9716");
  const [pickupLng, setPickupLng] = useState("77.5946");

  const [destLabel, setDestLabel] = useState("Tech Park East Campus");
  const [destLat, setDestLat] = useState("12.9850");
  const [destLng, setDestLng] = useState("77.6050");

  const fetchRides = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rides");
      if (res.ok) {
        const json = await res.json();
        setRides(json.data || []);
      }
    } catch {
      // Stale or unauthenticated state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/rides");
        if (res.ok && !ignore) {
          const json = await res.json();
          setRides(json.data || []);
        }
      } catch {
        // Offline or unauthenticated
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

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
            label: pickupLabel,
            lat: parseFloat(pickupLat),
            lng: parseFloat(pickupLng),
          },
          destination: {
            label: destLabel,
            lat: parseFloat(destLat),
            lng: parseFloat(destLng),
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
    <div className="max-w-6xl mx-auto py-8 px-6">
      <div className="border-b border-[#D6DCD2] pb-4 mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#68746C]">Passenger Portal</span>
          <h1 className="text-2xl font-bold tracking-tight text-[#18231D]">Book & Track Rides</h1>
        </div>
        <button
          onClick={fetchRides}
          disabled={loading}
          className="text-xs font-medium px-3 py-1.5 border border-[#D6DCD2] rounded bg-white hover:bg-[#EAECE5] transition-colors"
        >
          {loading ? "Refreshing..." : "Refresh Status"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Booking Form Rail */}
        <div className="lg:col-span-5 bg-white border border-[#D6DCD2] rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#18231D] mb-4">Request a Ride</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-[#B7443E] text-xs rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleBookRide} className="space-y-4 text-sm">
            <div>
              <label htmlFor="pickup-loc" className="block text-xs font-medium text-[#35423A] mb-1">
                Pickup Location Name
              </label>
              <input
                id="pickup-loc"
                type="text"
                value={pickupLabel}
                onChange={(e) => setPickupLabel(e.target.value)}
                className="w-full border border-[#D6DCD2] rounded px-3 py-2 text-sm focus:border-[#245A43]"
                required
              />
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                  type="number"
                  step="any"
                  value={pickupLat}
                  onChange={(e) => setPickupLat(e.target.value)}
                  placeholder="Pickup Lat"
                  className="border border-[#D6DCD2] rounded px-2 py-1 text-xs"
                  required
                />
                <input
                  type="number"
                  step="any"
                  value={pickupLng}
                  onChange={(e) => setPickupLng(e.target.value)}
                  placeholder="Pickup Lng"
                  className="border border-[#D6DCD2] rounded px-2 py-1 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="dest-loc" className="block text-xs font-medium text-[#35423A] mb-1">
                Destination Location Name
              </label>
              <input
                id="dest-loc"
                type="text"
                value={destLabel}
                onChange={(e) => setDestLabel(e.target.value)}
                className="w-full border border-[#D6DCD2] rounded px-3 py-2 text-sm focus:border-[#245A43]"
                required
              />
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                  type="number"
                  step="any"
                  value={destLat}
                  onChange={(e) => setDestLat(e.target.value)}
                  placeholder="Dest Lat"
                  className="border border-[#D6DCD2] rounded px-2 py-1 text-xs"
                  required
                />
                <input
                  type="number"
                  step="any"
                  value={destLng}
                  onChange={(e) => setDestLng(e.target.value)}
                  placeholder="Dest Lng"
                  className="border border-[#D6DCD2] rounded px-2 py-1 text-xs"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full bg-[#245A43] hover:bg-[#1b4332] text-white py-2.5 px-4 rounded font-medium text-sm transition-colors disabled:opacity-50"
              >
                {bookingLoading ? "Calculating & Dispatching..." : "Request Ride Now"}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-[#D6DCD2] pt-4 text-xs text-[#68746C]">
            <span className="font-semibold text-[#18231D]">Pricing Transparency:</span> Standard rate ₹50 base + ₹15/km. ETA calculated from assumed 30 km/h baseline.
          </div>
        </div>

        {/* Active Ride & History Rail */}
        <div className="lg:col-span-7 space-y-6">
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

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-xs text-[#68746C] block">From:</span>
                  <span className="font-medium text-[#18231D]">{activeRide.pickup_label}</span>
                </div>
                <div>
                  <span className="text-xs text-[#68746C] block">To:</span>
                  <span className="font-medium text-[#18231D]">{activeRide.destination_label}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#D6DCD2] text-center">
                <div>
                  <span className="text-xs text-[#68746C] block">Distance</span>
                  <span className="font-bold text-[#18231D]">{activeRide.distance_km} km</span>
                </div>
                <div>
                  <span className="text-xs text-[#68746C] block">Fare Estimate</span>
                  <span className="font-bold text-[#245A43]">₹{activeRide.fare_estimate}</span>
                </div>
                <div>
                  <span className="text-xs text-[#68746C] block">Trip ETA</span>
                  <span className="font-bold text-[#18231D]">{activeRide.trip_eta_minutes || "--"} mins</span>
                </div>
              </div>

              <div className="mt-4 text-xs text-[#68746C]">
                {activeRide.assigned_driver_id ? (
                  <span>Assigned Driver ID: <code className="bg-[#EAECE5] px-1 py-0.5 rounded">{activeRide.assigned_driver_id}</code></span>
                ) : (
                  <span className="text-[#B96A2E]">Searching for nearest eligible driver...</span>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-[#D6DCD2] bg-white/60 rounded-lg p-8 text-center text-sm text-[#68746C]">
              No active ride request. Submit the booking form to match with a driver.
            </div>
          )}

          {/* Ride History */}
          <div className="bg-white border border-[#D6DCD2] rounded-lg p-6">
            <h3 className="text-base font-bold text-[#18231D] mb-4">Recent Ride History</h3>
            {rides.length === 0 ? (
              <p className="text-xs text-[#68746C]">No ride history records found.</p>
            ) : (
              <div className="divide-y divide-[#D6DCD2]">
                {rides.map((ride) => (
                  <div key={ride.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-[#18231D]">{ride.pickup_label} &rarr; {ride.destination_label}</div>
                      <div className="text-[#68746C] mt-0.5">
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
