"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icon paths
const createColorIcon = (color: string) => {
  return L.divIcon({
    className: "custom-map-marker",
    html: `<div style="
      background-color: ${color};
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

const pickupIcon = createColorIcon("#245A43"); // Forest Green
const destIcon = createColorIcon("#B7443E"); // Red Accent
const driverIcon = createColorIcon("#476B75"); // Muted Teal Driver

function MapUpdater({
  center,
  bounds,
}: {
  center: [number, number];
  bounds?: [[number, number], [number, number]];
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else {
      map.setView(center, map.getZoom());
    }
  }, [center, bounds, map]);
  return null;
}

export interface MapMarkerPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  type: "pickup" | "destination" | "driver";
}

interface OperationsMapProps {
  pickup?: { lat: number; lng: number; label: string };
  destination?: { lat: number; lng: number; label: string };
  drivers?: Array<{ id: string; lat: number; lng: number; label: string; eta?: number }>;
  routeCoordinates?: [number, number][];
  isRealRoad?: boolean;
  height?: string;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}

export default function OperationsMap({
  pickup,
  destination,
  drivers = [],
  routeCoordinates,
  isRealRoad = false,
  height = "420px",
}: OperationsMapProps) {
  const defaultCenter: [number, number] = pickup
    ? [pickup.lat, pickup.lng]
    : [12.9716, 77.5946];

  const bounds: [[number, number], [number, number]] | undefined =
    pickup && destination
      ? [
          [Math.min(pickup.lat, destination.lat), Math.min(pickup.lng, destination.lng)],
          [Math.max(pickup.lat, destination.lat), Math.max(pickup.lng, destination.lng)],
        ]
      : undefined;

  const polylineCoords: [number, number][] =
    routeCoordinates && routeCoordinates.length > 0
      ? routeCoordinates
      : pickup && destination
      ? [
          [pickup.lat, pickup.lng],
          [destination.lat, destination.lng],
        ]
      : [];

  return (
    <div
      className="relative rounded-lg overflow-hidden border border-[#D6DCD2] bg-[#EAECE5] shadow-inner"
      style={{ height }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
        <MapUpdater center={defaultCenter} bounds={bounds} />

        {/* Required OpenStreetMap Attribution */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Pickup Marker */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-xs">
                <span className="font-bold text-[#245A43] block">PICKUP</span>
                <span>{pickup.label}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
            <Popup>
              <div className="text-xs">
                <span className="font-bold text-[#B7443E] block">DESTINATION</span>
                <span>{destination.label}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Nearby Drivers Markers */}
        {drivers.map((d) => (
          <Marker key={d.id} position={[d.lat, d.lng]} icon={driverIcon}>
            <Popup>
              <div className="text-xs">
                <span className="font-bold text-[#476B75] block">DRIVER</span>
                <span>{d.label}</span>
                {d.eta && <span className="block text-gray-500">~{d.eta} mins pickup ETA</span>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Road polyline or straight-line connection indicator */}
        {polylineCoords.length > 0 && (
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: "#245A43",
              weight: isRealRoad && polylineCoords.length > 2 ? 5 : 3,
              dashArray: isRealRoad && polylineCoords.length > 2 ? undefined : "6, 6",
              opacity: 0.85,
            }}
          />
        )}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-2 rounded border border-[#D6DCD2] text-[11px] shadow">
        <span className="font-bold text-[#18231D] block mb-1">Map Legend</span>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#245A43]"></span>
            <span>Pickup</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#B7443E]"></span>
            <span>Destination</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#476B75]"></span>
            <span>Driver Telemetry</span>
          </div>
          {isRealRoad && (
            <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
              <span className="inline-block w-3 h-1 bg-[#245A43]"></span>
              <span className="font-bold text-[#245A43]">Road Route (OSRM)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

