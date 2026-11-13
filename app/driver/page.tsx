"use client";

import React, { useState, useEffect } from "react";
import { Ride } from "@/lib/schemas/database";
import { createClient } from "@/lib/auth/client";

export default function DriverWorkspace() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // Live GPS Telemetry state
  const [isBroadcastingGps, setIsBroadcastingGps] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

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
        if (!session || session.user.email !== "driver-alpha@fairride.demo") {
          await supabase.auth.signInWithPassword({
            email: "driver-alpha@fairride.demo",
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
        // Offline or unauthenticated
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  // Sub-second Realtime WebSockets for Instant Dispatch Push
  useEffect(() => {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel("driver-realtime-rides")
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
      // Fallback for non-websocket test environments
    }
  }, []);

  // Live GPS Telemetry Broadcaster
  useEffect(() => {
    if (!isBroadcastingGps || typeof window === "undefined" || !navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude, accuracy: Math.round(accuracy) });
        setGpsError(null);

        try {
          await fetch("/api/drivers/telemetry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              driverId: "123e4567-e89b-12d3-a456-426614174010",
              lat: latitude,
              lng: longitude,
            }),
          });
        } catch {
          // Offline fallback
        }
      },
      (err) => {
        setGpsError(err.message);
        setIsBroadcastingGps(false);
      },
      { enableHighAccuracy: true, maximumAge: 3000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isBroadcastingGps]);

  const handleRespond = async (rideId: string, decision: "accept" | "reject") => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/rides/${rideId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Action failed");
      }
      setMessage(`Offer successfully ${decision}ed.`);
      await fetchRides();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Error responding to offer");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (rideId: string, nextStatus: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/rides/${rideId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Status update failed");
      }
      setMessage(`Status updated to ${nextStatus}.`);
      await fetchRides();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Error updating status");
    } finally {
      setActionLoading(false);
    }
  };

  const activeOffer = rides.find((r) => r.status === "requested");
  const ongoingRide = rides.find((r) =>
    ["accepted", "arriving", "ongoing"].includes(r.status)
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <div className="border-b border-[#D6DCD2] pb-4 mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#68746C]">Driver Mobile Workspace</span>
          <h1 className="text-2xl font-bold tracking-tight text-[#18231D]">Trip Operations</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBroadcastingGps(!isBroadcastingGps)}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors flex items-center gap-1.5 shadow-sm ${
              isBroadcastingGps
                ? "bg-[#B7443E] text-white animate-pulse"
                : "bg-white border border-[#245A43] text-[#245A43] hover:bg-[#EAF2ED]"
            }`}
          >
            <span>📡</span>
            <span>{isBroadcastingGps ? "Broadcasting GPS" : "Broadcast Live GPS"}</span>
          </button>
          <span className="text-xs px-2.5 py-1 rounded bg-[#EAF2ED] text-[#245A43] border border-[#245A43]/20 font-medium">
            ● Driver Alpha
          </span>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
              isOnline
                ? "bg-[#245A43] text-white"
                : "bg-gray-200 text-[#35423A]"
            }`}
          >
            {isOnline ? "● ONLINE" : "○ OFFLINE"}
          </button>
          <button
            onClick={fetchRides}
            disabled={loading}
            className="text-xs font-medium px-3 py-1.5 border border-[#D6DCD2] rounded bg-white hover:bg-[#EAECE5]"
          >
            {loading ? "..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Live GPS Telemetry Status Banner */}
      {isBroadcastingGps && (
        <div className="mb-4 p-2.5 bg-[#EAF2ED] border border-[#245A43]/30 rounded-lg text-xs text-[#245A43] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#245A43] animate-ping"></span>
            <span>
              Live Device GPS Active:{" "}
              <strong>
                {gpsCoords
                  ? `${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)}`
                  : "Acquiring satellite fix..."}
              </strong>
            </span>
          </div>
          {gpsCoords && (
            <span className="text-[11px] text-[#68746C]">
              Accuracy: &plusmn;{gpsCoords.accuracy}m &bull; Supabase Realtime Synced
            </span>
          )}
        </div>
      )}

      {gpsError && (
        <div className="mb-4 p-2 bg-amber-50 border border-amber-200 text-[#B96A2E] rounded text-xs">
          GPS Notice: {gpsError}. Ensure browser location permission is allowed.
        </div>
      )}

      {message && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 text-[#476B75] text-xs rounded">
          {message}
        </div>
      )}

      {/* Incoming Offer Banner */}
      {activeOffer && (
        <div className="mb-6 border-2 border-[#245A43] bg-white rounded-lg p-6 shadow-md animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#245A43]">
              ★ New Dispatch Offer Received
            </span>
            <span className="text-xs font-bold bg-[#D6EE74] text-[#18231D] px-2 py-0.5 rounded">
              High Go-Fair Match
            </span>
          </div>

          <h2 className="text-xl font-bold text-[#18231D] mb-1">
            {activeOffer.pickup_label} &rarr; {activeOffer.destination_label}
          </h2>
          <div className="flex items-center gap-4 text-xs text-[#68746C] mb-6">
            <span>Distance: <strong>{activeOffer.distance_km} km</strong></span>
            <span>Estimated Payout: <strong className="text-[#245A43]">₹{activeOffer.fare_estimate}</strong></span>
            <span>Pickup ETA: <strong>~{activeOffer.pickup_eta_minutes || 6} mins</strong></span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleRespond(activeOffer.id, "reject")}
              disabled={actionLoading}
              className="py-3 px-4 border border-[#B7443E] text-[#B7443E] rounded font-bold text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Decline Offer
            </button>
            <button
              onClick={() => handleRespond(activeOffer.id, "accept")}
              disabled={actionLoading}
              className="py-3 px-4 bg-[#245A43] text-white rounded font-bold text-sm hover:bg-[#1b4332] transition-colors disabled:opacity-50"
            >
              Accept Ride
            </button>
          </div>
        </div>
      )}

      {/* Active In-Progress Ride */}
      {ongoingRide && (
        <div className="mb-6 border border-[#D6DCD2] bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#68746C]">Current Trip Lifecycle</span>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#245A43] text-white uppercase">
              {ongoingRide.status}
            </span>
          </div>

          <div className="space-y-3 mb-6 text-sm">
            <div>
              <span className="text-xs text-[#68746C] block">Pickup Passenger At:</span>
              <span className="font-bold text-[#18231D] text-base">{ongoingRide.pickup_label}</span>
            </div>
            <div>
              <span className="text-xs text-[#68746C] block">Dropoff Destination:</span>
              <span className="font-bold text-[#18231D] text-base">{ongoingRide.destination_label}</span>
            </div>
          </div>

          <div className="border-t border-[#D6DCD2] pt-4">
            <span className="text-xs font-semibold text-[#35423A] block mb-2">Driver Action Controls:</span>
            {ongoingRide.status === "accepted" && (
              <button
                onClick={() => handleUpdateStatus(ongoingRide.id, "arriving")}
                disabled={actionLoading}
                className="w-full py-3 bg-[#245A43] hover:bg-[#1b4332] text-white font-bold rounded text-sm transition-colors"
              >
                Start Heading to Pickup (Arriving)
              </button>
            )}

            {ongoingRide.status === "arriving" && (
              <button
                onClick={() => handleUpdateStatus(ongoingRide.id, "ongoing")}
                disabled={actionLoading}
                className="w-full py-3 bg-[#245A43] hover:bg-[#1b4332] text-white font-bold rounded text-sm transition-colors"
              >
                Confirm Passenger Picked Up (Trip Ongoing)
              </button>
            )}

            {ongoingRide.status === "ongoing" && (
              <button
                onClick={() => handleUpdateStatus(ongoingRide.id, "completed")}
                disabled={actionLoading}
                className="w-full py-3 bg-[#245A43] hover:bg-[#1b4332] text-white font-bold rounded text-sm transition-colors"
              >
                Complete Ride & Finalize Fare
              </button>
            )}
          </div>
        </div>
      )}

      {/* Driver Trip History */}
      <div className="bg-white border border-[#D6DCD2] rounded-lg p-6">
        <h3 className="text-base font-bold text-[#18231D] mb-4">Recent Completed Assignments</h3>
        {rides.length === 0 ? (
          <p className="text-xs text-[#68746C]">No driver trips recorded yet.</p>
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
  );
}
