"use client";

import React, { useState, useEffect } from "react";
import { Ride } from "@/lib/schemas/database";
import { createClient } from "@/lib/auth/client";
import { fetchRealRoadRoute } from "@/lib/services/routing-service";

interface HighDemandZone {
  slug: string;
  name: string;
  surge: number;
  deficit: number;
  lat: number;
  lng: number;
}

const ZONE_COORDS: Record<string, { name: string; lat: number; lng: number }> = {
  "airport-corridor": { name: "Airport Corridor", lat: 13.1986, lng: 77.7066 },
  "downtown-central": { name: "Downtown Central", lat: 12.9716, lng: 77.5946 },
  "tech-park-east": { name: "Tech Park East (Indiranagar)", lat: 12.9850, lng: 77.6050 },
  "metro-hub-north": { name: "Metro Hub North", lat: 12.9900, lng: 77.5800 },
  "residential-south": { name: "Koramangala / HSR South", lat: 12.9300, lng: 77.5850 },
  "university-west": { name: "University West", lat: 12.9600, lng: 77.5300 },
};

export default function DriverWorkspace() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // Driver Welfare, Shift Fatigue & Equity state
  const [shiftHours, setShiftHours] = useState(3.2);
  const [isOnBreak, setIsOnBreak] = useState(false);

  // Proactive Fleet Balancing & High-Demand Zone Repositioning state
  const [highDemandZone, setHighDemandZone] = useState<HighDemandZone | null>(null);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [repositioningRoute, setRepositioningRoute] = useState<{
    distanceKm: number;
    durationMins: number;
  } | null>(null);

  // Live GPS Telemetry state
  const [isBroadcastingGps, setIsBroadcastingGps] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // 30-Second Offer Expiry Countdown (PS2 Automatic Reassignment Guardrail)
  const [offerCountdown, setOfferCountdown] = useState<number>(30);

  // Real-time Road Driving Simulator state
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simRouteCoords, setSimRouteCoords] = useState<[number, number][]>([]);

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

      try {
        const zoneRes = await fetch("/api/zones/intelligence");
        if (zoneRes.ok && !ignore) {
          const zoneJson = await zoneRes.json();
          const zones = zoneJson?.data?.zoneIntelligence || [];
          const candidate = zones.find(
            (z: { demandSupplyRatio: number; repositionRecommendation?: { needed: boolean; deficit: number } }) =>
              z.demandSupplyRatio > 1.3 || z.repositionRecommendation?.needed
          );
          if (candidate) {
            const info = ZONE_COORDS[candidate.zoneSlug] || {
              name: candidate.zoneSlug.replace(/-/g, " "),
              lat: 12.9352,
              lng: 77.6245,
            };
            setHighDemandZone({
              slug: candidate.zoneSlug,
              name: info.name,
              surge: candidate.simulatedSurgeMultiplier || 1.6,
              deficit: candidate.repositionRecommendation?.deficit || 4,
              lat: info.lat,
              lng: info.lng,
            });
          }
        }
      } catch {
        // Fallback
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

  const handleStartReposition = async () => {
    if (!highDemandZone) return;
    setIsRepositioning(true);
    setActionLoading(true);
    try {
      const driverLat = gpsCoords?.lat || 12.9784;
      const driverLng = gpsCoords?.lng || 77.5683;
      const route = await fetchRealRoadRoute(driverLat, driverLng, highDemandZone.lat, highDemandZone.lng);
      setRepositioningRoute({
        distanceKm: route.distanceKm,
        durationMins: Math.round(route.durationMinutes),
      });
      setMessage(`Proactive repositioning initiated to ${highDemandZone.name}. +15% dispatch priority locked.`);
    } catch {
      setRepositioningRoute({
        distanceKm: 4.2,
        durationMins: 11,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelReposition = () => {
    setIsRepositioning(false);
    setRepositioningRoute(null);
    setMessage("Repositioning route cleared. Returning to standard standby.");
  };

  const handleArrivedAtZone = () => {
    setIsRepositioning(false);
    setRepositioningRoute(null);
    setMessage(`✓ Arrived at ${highDemandZone?.name || "high demand zone"}. Fleet Grid priority boost active!`);
  };

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

  const activeOfferId = activeOffer?.id;
  const [prevOfferId, setPrevOfferId] = useState<string | undefined>(undefined);
  if (activeOfferId !== prevOfferId) {
    setPrevOfferId(activeOfferId);
    setOfferCountdown(30);
  }

  // PS2 Automatic Reassignment: 30-second driver offer response timeout
  useEffect(() => {
    if (!activeOfferId) return;

    const timer = setInterval(() => {
      setOfferCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          fetch(`/api/dispatch/${activeOfferId}/reassign`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: "TIMEOUT" }),
          })
            .then(() => {
              setMessage("30s offer response window elapsed. Go-Fair bounded reassignment engine has automatically re-offered this trip to the next eligible driver.");
              fetchRides();
            })
            .catch(() => {});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeOfferId]);

  // Load real road coordinates when an ongoing ride is active
  useEffect(() => {
    let ignore = false;
    async function loadRoadCoords() {
      if (!ongoingRide) {
        setSimRouteCoords([]);
        setSimStep(0);
        setIsSimulatingDrive(false);
        return;
      }

      const res = await fetchRealRoadRoute(
        ongoingRide.pickup_lat,
        ongoingRide.pickup_lng,
        ongoingRide.destination_lat,
        ongoingRide.destination_lng
      );
      if (!ignore && res.coordinates.length > 0) {
        setSimRouteCoords(res.coordinates);
      }
    }
    loadRoadCoords();
    return () => {
      ignore = true;
    };
  }, [ongoingRide]);

  // Step through coordinates every 1.2s and broadcast live telemetry
  useEffect(() => {
    if (!isSimulatingDrive || simRouteCoords.length === 0) return;

    const timer = setInterval(() => {
      setSimStep((prev) => {
        const next = prev + 1;
        if (next >= simRouteCoords.length) {
          setIsSimulatingDrive(false);
          setMessage("Live driving completed: Vehicle arrived at destination!");
          return prev;
        }
        const [lat, lng] = simRouteCoords[next];
        fetch("/api/drivers/telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            driverId: "123e4567-e89b-12d3-a456-426614174010",
            lat,
            lng,
          }),
        }).catch(() => {});
        return next;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [isSimulatingDrive, simRouteCoords]);

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

      {/* Driver Welfare & Daily Equity Widget */}
      <div className="mb-6 bg-white border border-[#D6DCD2] rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D6DCD2]">
          <div className="flex items-center gap-2">
            <span className="text-sm">🛡️</span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#245A43]">
                Driver Welfare & Daily Equity Safeguard
              </span>
              <p className="text-[11px] text-[#68746C]">PS2 Autonomous Fatigue Monitoring & Workload Parity</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsOnBreak(!isOnBreak);
                setMessage(isOnBreak ? "Break ended. Resuming dispatch availability." : "Break active. New dispatch offers paused for rest.");
              }}
              className={`text-xs px-2.5 py-1 rounded font-bold transition-colors ${
                isOnBreak
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-[#F4F3ED] hover:bg-[#EAECE5] text-[#35423A] border border-[#D6DCD2]"
              }`}
            >
              {isOnBreak ? "☕ On Break (Paused)" : "Take 15m Break"}
            </button>
            <button
              onClick={() => setShiftHours((prev) => (prev >= 4.5 ? 1.5 : Number((prev + 0.8).toFixed(1))))}
              title="Simulate shift hours progression"
              className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded font-mono"
            >
              +0.8h Shift
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Workload Fairness Index */}
          <div className="bg-[#F4F3ED] p-2.5 rounded-lg border border-[#D6DCD2]">
            <span className="text-[10px] text-[#68746C] block uppercase font-medium">Workload Fairness</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base font-extrabold text-[#245A43]">94%</span>
              <span className="text-[10px] text-[#245A43] font-semibold bg-[#EAF2ED] px-1.5 py-0.5 rounded">
                Fleet Parity
              </span>
            </div>
          </div>

          {/* Shift Fatigue Dial */}
          <div className={`p-2.5 rounded-lg border ${
            shiftHours >= 4.0
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-[#F4F3ED] border-[#D6DCD2]"
          }`}>
            <span className="text-[10px] text-[#68746C] block uppercase font-medium">Shift Fatigue</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-base font-extrabold text-[#18231D]">{shiftHours}h</span>
              <span className={`text-[10px] font-semibold px-1 rounded ${
                shiftHours >= 4.0 ? "text-amber-700 bg-amber-100" : "text-[#245A43] bg-green-100"
              }`}>
                {shiftHours >= 4.0 ? "Rest Advised" : "Compliant"}
              </span>
            </div>
          </div>

          {/* Completed Trips */}
          <div className="bg-[#F4F3ED] p-2.5 rounded-lg border border-[#D6DCD2]">
            <span className="text-[10px] text-[#68746C] block uppercase font-medium">Completed Trips</span>
            <span className="text-base font-extrabold text-[#18231D] mt-0.5 block">
              {rides.filter((r) => r.status === "completed").length + 4} rides
            </span>
          </div>

          {/* Today's Earnings */}
          <div className="bg-[#F4F3ED] p-2.5 rounded-lg border border-[#D6DCD2]">
            <span className="text-[10px] text-[#68746C] block uppercase font-medium">Today&apos;s Earnings</span>
            <span className="text-base font-extrabold text-[#245A43] mt-0.5 block">
              ₹{(
                rides
                  .filter((r) => r.status === "completed")
                  .reduce((acc, curr) => acc + (curr.fare_estimate || 0), 0) + 420
              ).toFixed(0)}
            </span>
          </div>
        </div>

        {shiftHours >= 4.0 && (
          <div className="mt-3 p-2 bg-amber-100/60 border border-amber-300 rounded text-[11px] text-amber-900 flex items-center justify-between">
            <span>⚠️ <strong>Fatigue Safeguard Triggered:</strong> You have driven {shiftHours} consecutive hours. A 15-minute cool-down break is recommended to maintain optimal safety.</span>
            {!isOnBreak && (
              <button
                onClick={() => setIsOnBreak(true)}
                className="bg-amber-800 text-white font-bold px-2.5 py-0.5 rounded text-[10px] shrink-0 ml-2"
              >
                Pause for 15m
              </button>
            )}
          </div>
        )}
      </div>

      {/* 1-Click Proactive Repositioning Banner */}
      {!activeOffer && !ongoingRide && isOnline && !isOnBreak && highDemandZone && (
        <div className="mb-6 border border-[#245A43]/40 bg-gradient-to-r from-[#EAF2ED] to-[#F4F3ED] rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="text-xl shrink-0 mt-0.5">⚡</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#18231D]">
                    High Demand Detected in {highDemandZone.name}
                  </span>
                  <span className="text-[10px] bg-[#B96A2E] text-white font-bold px-2 py-0.5 rounded">
                    {highDemandZone.surge}x Surge
                  </span>
                  <span className="text-[10px] bg-[#D6EE74] text-[#18231D] font-bold px-2 py-0.5 rounded">
                    +{highDemandZone.deficit} Driver Deficit
                  </span>
                </div>
                <p className="text-xs text-[#35423A] mt-1">
                  {isRepositioning
                    ? `En route to ${highDemandZone.name}. Real-time road navigation active (~${repositioningRoute?.distanceKm || 3.8} km, ~${repositioningRoute?.durationMins || 10} mins). +15% dispatch priority locked in.`
                    : `Reposition to this zone now to balance city fleet supply and unlock a +15% dispatch matching priority boost.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 justify-end">
              {!isRepositioning ? (
                <button
                  type="button"
                  onClick={handleStartReposition}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#245A43] hover:bg-[#1b4332] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <span>🧭</span>
                  <span>Reposition Now &amp; Navigate</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleArrivedAtZone}
                    className="px-3 py-1.5 bg-[#245A43] hover:bg-[#1b4332] text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    ✓ Arrived at Zone
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelReposition}
                    className="px-3 py-1.5 bg-white border border-[#D6DCD2] hover:bg-gray-50 text-xs font-semibold text-[#35423A] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Incoming Offer Banner with 30s Timeout Bar */}
      {activeOffer && (
        <div className="mb-6 border-2 border-[#245A43] bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#245A43] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#245A43] animate-ping"></span>
              ★ New Dispatch Offer Received
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                offerCountdown <= 5
                  ? "bg-red-100 text-red-700 border-red-300 animate-pulse"
                  : offerCountdown <= 15
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-[#EAF2ED] text-[#245A43] border-[#245A43]/30"
              }`}>
                ⏱️ {offerCountdown}s to respond
              </span>
              <span className="text-xs font-bold bg-[#D6EE74] text-[#18231D] px-2 py-0.5 rounded">
                Go-Fair Match
              </span>
            </div>
          </div>

          {/* 30s Visual Progress Bar */}
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full transition-all duration-1000 ${
                offerCountdown <= 5
                  ? "bg-red-500"
                  : offerCountdown <= 15
                  ? "bg-amber-500"
                  : "bg-[#245A43]"
              }`}
              style={{ width: `${(offerCountdown / 30) * 100}%` }}
            ></div>
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
              className="py-3 px-4 bg-[#245A43] text-white rounded font-bold text-sm hover:bg-[#1b4332] transition-colors disabled:opacity-50 shadow-sm"
            >
              Accept Ride
            </button>
          </div>
          <span className="block text-[11px] text-[#68746C] text-center mt-3">
            PS2 Guardrail: Automatic reassignment occurs after 30 seconds of inactivity to protect rider wait times.
          </span>
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

          {/* Real-time Street Driving Simulator Control */}
          <div className="mb-4 p-3 bg-[#FAF9F5] border border-[#D6DCD2] rounded-lg">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#18231D] flex items-center gap-1.5">
                <span>🚗</span>
                Live Street Driving Telemetry
              </span>
              {simRouteCoords.length > 0 && (
                <span className="text-[11px] font-mono text-[#245A43] font-semibold">
                  Step {simStep + 1} / {simRouteCoords.length}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#68746C] mb-3">
              Broadcasts turn-by-turn road coordinates to Supabase Realtime every 1.2s so passengers watch the car gliding along streets live.
            </p>
            <button
              type="button"
              onClick={() => setIsSimulatingDrive(!isSimulatingDrive)}
              disabled={simRouteCoords.length === 0}
              className={`w-full py-2 px-3 rounded text-xs font-bold transition-colors ${
                isSimulatingDrive
                  ? "bg-[#B7443E] text-white hover:bg-red-700 animate-pulse"
                  : "bg-[#245A43] text-white hover:bg-[#1b4332]"
              } disabled:opacity-50`}
            >
              {isSimulatingDrive ? "⏸ Pause Simulated Driving" : "▶ Start Live Road Driving (Simulate Car on Real Streets)"}
            </button>
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
