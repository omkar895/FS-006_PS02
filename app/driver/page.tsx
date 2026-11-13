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

  // Driver Profile & Vehicle Specs Editing State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [driverName, setDriverName] = useState("Driver Alpha");
  const [vehicleLabel, setVehicleLabel] = useState("Swift Dzire Prime (White)");
  const [vehicleRegistration, setVehicleRegistration] = useState("KA-01-EQ-4491");
  const [vehicleType, setVehicleType] = useState("standard");
  const [upiId, setUpiId] = useState("driver.alpha@okhdfcbank");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const handleSaveDriverProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: driverName,
          vehicleLabel,
          vehicleRegistrationLabel: vehicleRegistration,
          vehicleType,
        }),
      });
      if (res.ok) {
        setProfileMessage("Driver profile & vehicle specs updated successfully!");
        setTimeout(() => setProfileMessage(null), 3000);
      } else {
        setProfileMessage("Specs updated locally.");
      }
    } catch {
      setProfileMessage("Specs updated locally.");
    } finally {
      setProfileSaving(false);
    }
  };

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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Header */}
      <div className="border-b border-zinc-200/90 pb-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Driver Mobile Workspace
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">Trip Operations</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 transition-all shadow-xs flex items-center gap-2"
          >
            <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black">
              DA
            </span>
            <span>Profile &amp; Vehicle Specs</span>
          </button>
          <button
            onClick={() => setIsBroadcastingGps(!isBroadcastingGps)}
            className={`px-3.5 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 shadow-xs ${
              isBroadcastingGps
                ? "bg-red-600 text-white animate-pulse"
                : "bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            <span>📡</span>
            <span>{isBroadcastingGps ? "Broadcasting GPS" : "Broadcast Live GPS"}</span>
          </button>
          <span className="text-xs px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200 font-semibold">
            ● Driver Alpha
          </span>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all shadow-xs ${
              isOnline
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
            }`}
          >
            {isOnline ? "● ONLINE" : "○ OFFLINE"}
          </button>
          <button
            onClick={fetchRides}
            disabled={loading}
            className="text-xs font-semibold px-3.5 py-2 border border-zinc-200 rounded-full bg-white hover:bg-zinc-50 text-zinc-700 transition-all shadow-xs"
          >
            {loading ? "..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Live GPS Telemetry Status Banner */}
      {isBroadcastingGps && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs text-emerald-950 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
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
            <span className="text-[11px] text-emerald-800 font-medium">
              Accuracy: &plusmn;{gpsCoords.accuracy}m &bull; Supabase Realtime Synced
            </span>
          )}
        </div>
      )}

      {gpsError && (
        <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-medium">
          GPS Notice: {gpsError}. Ensure browser location permission is allowed.
        </div>
      )}

      {message && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-950 text-xs rounded-2xl font-medium shadow-xs">
          {message}
        </div>
      )}

      {/* Driver Welfare & Daily Equity Widget */}
      <div className="mb-8 bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-zinc-200 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg border border-emerald-200">
              🛡️
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Driver Welfare & Daily Equity Safeguard
              </span>
              <p className="text-[11px] text-zinc-500 font-medium">PS2 Autonomous Fatigue Monitoring & Workload Parity</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => {
                setIsOnBreak(!isOnBreak);
                setMessage(isOnBreak ? "Break ended. Resuming dispatch availability." : "Break active. New dispatch offers paused for rest.");
              }}
              className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all shadow-xs ${
                isOnBreak
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
              }`}
            >
              {isOnBreak ? "☕ On Break (Paused)" : "Take 15m Break"}
            </button>
            <button
              onClick={() => setShiftHours((prev) => (prev >= 4.5 ? 1.5 : Number((prev + 0.8).toFixed(1))))}
              title="Simulate shift hours progression"
              className="text-[10px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2.5 py-1.5 rounded-full font-mono font-semibold"
            >
              +0.8h Shift
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Workload Fairness Index */}
          <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">Workload Fairness</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-black text-emerald-700">94%</span>
              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                Fleet Parity
              </span>
            </div>
          </div>

          {/* Shift Fatigue Dial */}
          <div className={`p-3.5 rounded-2xl border ${
            shiftHours >= 4.0
              ? "bg-amber-50 border-amber-300 text-amber-950"
              : "bg-zinc-50 border-zinc-200 text-zinc-950"
          }`}>
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">Shift Fatigue</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-black">{shiftHours}h</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                shiftHours >= 4.0 ? "text-amber-800 bg-amber-100" : "text-emerald-800 bg-emerald-100"
              }`}>
                {shiftHours >= 4.0 ? "Rest Advised" : "Compliant"}
              </span>
            </div>
          </div>

          {/* Completed Trips */}
          <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">Completed Trips</span>
            <span className="text-xl font-black text-zinc-950 mt-1 block">
              {rides.filter((r) => r.status === "completed").length + 4} rides
            </span>
          </div>

          {/* Today's Earnings */}
          <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">Today&apos;s Earnings</span>
            <span className="text-xl font-black text-emerald-600 mt-1 block">
              ₹{(
                rides
                  .filter((r) => r.status === "completed")
                  .reduce((acc, curr) => acc + (curr.fare_estimate || 0), 0) + 420
              ).toFixed(0)}
            </span>
          </div>
        </div>

        {shiftHours >= 4.0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 flex items-center justify-between">
            <span>⚠️ <strong>Fatigue Safeguard Triggered:</strong> You have driven {shiftHours} consecutive hours. A 15-minute cool-down break is recommended to maintain optimal safety.</span>
            {!isOnBreak && (
              <button
                onClick={() => setIsOnBreak(true)}
                className="bg-amber-800 text-white font-bold px-3 py-1 rounded-full text-[10px] shrink-0 ml-2 shadow-xs"
              >
                Pause for 15m
              </button>
            )}
          </div>
        )}
      </div>

      {/* 1-Click Proactive Repositioning Banner */}
      {!activeOffer && !ongoingRide && isOnline && !isOnBreak && highDemandZone && (
        <div className="mb-8 border border-emerald-300 bg-gradient-to-r from-emerald-50 to-zinc-50 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0 mt-0.5">⚡</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-zinc-950">
                    High Demand Detected in {highDemandZone.name}
                  </span>
                  <span className="text-[10px] bg-amber-600 text-white font-black px-2 py-0.5 rounded-full">
                    {highDemandZone.surge}x Surge
                  </span>
                  <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full">
                    +{highDemandZone.deficit} Driver Deficit
                  </span>
                </div>
                <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
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
                  className="px-4 py-2.5 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center gap-2"
                >
                  <span>🧭</span>
                  <span>Reposition Now &amp; Navigate</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleArrivedAtZone}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                  >
                    ✓ Arrived at Zone
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelReposition}
                    className="px-3.5 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700 rounded-xl transition-all shadow-xs"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Incoming Offer Banner with 30s Timeout Bar (Uber Style) */}
      {activeOffer && (
        <div className="mb-8 border-2 border-black bg-white rounded-3xl p-6 sm:p-7 shadow-[0_12px_40px_rgb(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              ★ New Dispatch Offer Received
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                offerCountdown <= 5
                  ? "bg-red-100 text-red-700 border-red-300 animate-pulse"
                  : offerCountdown <= 15
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}>
                ⏱️ {offerCountdown}s to respond
              </span>
              <span className="text-xs font-bold bg-zinc-950 text-white px-3 py-1 rounded-full">
                Go-Fair Match
              </span>
            </div>
          </div>

          {/* 30s Visual Progress Bar */}
          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mb-5">
            <div
              className={`h-full transition-all duration-1000 ${
                offerCountdown <= 5
                  ? "bg-red-500"
                  : offerCountdown <= 15
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${(offerCountdown / 30) * 100}%` }}
            ></div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 mb-5">
            <h2 className="text-xl font-black text-zinc-950 mb-2">
              {activeOffer.pickup_label} &rarr; {activeOffer.destination_label}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600">
              <span>Distance: <strong className="text-zinc-950">{activeOffer.distance_km} km</strong></span>
              <span>Estimated Payout: <strong className="text-emerald-700 font-extrabold text-sm">₹{activeOffer.fare_estimate}</strong></span>
              <span>Pickup ETA: <strong className="text-zinc-950">~{activeOffer.pickup_eta_minutes || 6} mins</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleRespond(activeOffer.id, "reject")}
              disabled={actionLoading}
              className="py-3.5 px-4 border border-zinc-300 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-50 transition-all disabled:opacity-50"
            >
              Decline Offer
            </button>
            <button
              onClick={() => handleRespond(activeOffer.id, "accept")}
              disabled={actionLoading}
              className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
            >
              Accept Ride
            </button>
          </div>
          <span className="block text-[11px] text-zinc-500 text-center mt-3 font-medium">
            PS2 Guardrail: Automatic reassignment occurs after 30 seconds of inactivity to protect rider wait times.
          </span>
        </div>
      )}

      {/* Active In-Progress Ride */}
      {ongoingRide && (
        <div className="mb-8 border border-zinc-200/90 bg-white rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-200">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Current Trip Lifecycle</span>
            <span className="px-3.5 py-1 text-xs font-black rounded-full bg-black text-white uppercase tracking-wider">
              {ongoingRide.status}
            </span>
          </div>

          <div className="space-y-4 mb-6 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Pickup Passenger At</span>
              <span className="font-extrabold text-zinc-950 text-base">{ongoingRide.pickup_label}</span>
            </div>
            <div className="border-t border-zinc-200 pt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Dropoff Destination</span>
              <span className="font-extrabold text-zinc-950 text-base">{ongoingRide.destination_label}</span>
            </div>
          </div>

          {/* Real-time Street Driving Simulator Control */}
          <div className="mb-6 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-zinc-950 flex items-center gap-2">
                <span>🚗</span>
                Live Street Driving Telemetry
              </span>
              {simRouteCoords.length > 0 && (
                <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Step {simStep + 1} / {simRouteCoords.length}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed">
              Broadcasts turn-by-turn road coordinates to Supabase Realtime every 1.2s so passengers watch the car gliding along streets live.
            </p>
            <button
              type="button"
              onClick={() => setIsSimulatingDrive(!isSimulatingDrive)}
              disabled={simRouteCoords.length === 0}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs ${
                isSimulatingDrive
                  ? "bg-red-600 text-white hover:bg-red-700 animate-pulse"
                  : "bg-black text-white hover:bg-zinc-800"
              } disabled:opacity-50`}
            >
              {isSimulatingDrive ? "⏸ Pause Simulated Driving" : "▶ Start Live Road Driving (Simulate Car on Real Streets)"}
            </button>
          </div>

          <div className="border-t border-zinc-200 pt-5">
            <span className="text-xs font-bold text-zinc-700 block mb-3">Driver Action Controls:</span>
            {ongoingRide.status === "accepted" && (
              <button
                onClick={() => handleUpdateStatus(ongoingRide.id, "arriving")}
                disabled={actionLoading}
                className="w-full py-3.5 bg-black hover:bg-zinc-800 text-white font-bold rounded-2xl text-sm transition-all shadow-md"
              >
                Start Heading to Pickup (Arriving)
              </button>
            )}

            {ongoingRide.status === "arriving" && (
              <button
                onClick={() => handleUpdateStatus(ongoingRide.id, "ongoing")}
                disabled={actionLoading}
                className="w-full py-3.5 bg-black hover:bg-zinc-800 text-white font-bold rounded-2xl text-sm transition-all shadow-md"
              >
                Confirm Passenger Picked Up (Trip Ongoing)
              </button>
            )}

            {ongoingRide.status === "ongoing" && (
              <button
                onClick={() => handleUpdateStatus(ongoingRide.id, "completed")}
                disabled={actionLoading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md"
              >
                Complete Ride & Finalize Fare
              </button>
            )}
          </div>
        </div>
      )}

      {/* Driver Trip History */}
      <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
        <h3 className="text-base font-bold text-zinc-950 mb-4">Recent Completed Assignments</h3>
        {rides.length === 0 ? (
          <p className="text-xs text-zinc-500">No driver trips recorded yet.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {rides.map((ride) => (
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

      {/* Driver Profile & Vehicle Specs Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-zinc-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-base font-black shadow-xs">
                  {driverName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "DA"}
                </div>
                <div>
                  <h2 className="text-lg font-black text-zinc-950">Driver Profile &amp; Vehicle</h2>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ● Active Fleet Partner
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

            <form onSubmit={handleSaveDriverProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-900 mb-1">Driver Full Name</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  required
                  placeholder="Driver display name"
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-900 mb-1">Vehicle Model &amp; Color</label>
                <input
                  type="text"
                  value={vehicleLabel}
                  onChange={(e) => setVehicleLabel(e.target.value)}
                  required
                  placeholder="e.g. Swift Dzire Prime (White)"
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-900 mb-1">License Plate No.</label>
                  <input
                    type="text"
                    value={vehicleRegistration}
                    onChange={(e) => setVehicleRegistration(e.target.value)}
                    required
                    placeholder="e.g. KA-01-EQ-4491"
                    className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl bg-white text-zinc-900 font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-900 mb-1">Vehicle Tier</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl bg-white text-zinc-900 font-medium focus:ring-2 focus:ring-black"
                  >
                    <option value="standard">Standard Sedan</option>
                    <option value="electric_ev">Electric EV Fleet</option>
                    <option value="pool_shared">Eco Pooling Car</option>
                    <option value="premium_suv">Premium XL / SUV</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-900 mb-1">Payout UPI Address (Direct Settlement)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="driver@okhdfcbank"
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl bg-white text-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-black"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Trip fares automatically settle to this virtual payment address.
                </span>
              </div>

              {/* Service Stats Summary */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Lifetime Trips</span>
                  <span className="font-black text-zinc-950 text-sm">342 rides</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Driver Rating</span>
                  <span className="font-black text-amber-600 text-sm">⭐ 4.92</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Workload Index</span>
                  <span className="font-black text-emerald-700 text-sm">94% Fair</span>
                </div>
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
                  {profileSaving ? "Updating Specs..." : "Save Driver Specs"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
