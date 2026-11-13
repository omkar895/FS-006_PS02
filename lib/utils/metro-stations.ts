import { calculateHaversineDistanceKm } from "@/lib/algorithms/pricing";

export interface MetroStation {
  name: string;
  line: string;
  lat: number;
  lng: number;
}

export const NAMMA_METRO_STATIONS: MetroStation[] = [
  { name: "Majestic Interchange Hub", line: "Purple & Green Cross", lat: 12.9757, lng: 77.5728 },
  { name: "MG Road Station", line: "Purple Line", lat: 12.9754, lng: 77.6066 },
  { name: "Indiranagar Metro Hub", line: "Purple Line", lat: 12.9783, lng: 77.6408 },
  { name: "Trinity Metro Station", line: "Purple Line", lat: 12.9729, lng: 77.6171 },
  { name: "South End Circle Station", line: "Green Line", lat: 12.9288, lng: 77.5802 },
  { name: "Baiyappanahalli Terminal", line: "Purple Line", lat: 12.9907, lng: 77.6525 },
];

export function findNearestMetroStation(lat: number, lng: number): {
  station: MetroStation;
  distanceKm: number;
  transitMinutes: number;
} {
  let nearest = NAMMA_METRO_STATIONS[0];
  let minDistance = Infinity;

  for (const station of NAMMA_METRO_STATIONS) {
    const dist = calculateHaversineDistanceKm(lat, lng, station.lat, station.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = station;
    }
  }

  const transitMinutes = Math.max(3, Math.round((minDistance / 25) * 60 + 2));

  return {
    station: nearest,
    distanceKm: Math.round(minDistance * 10) / 10,
    transitMinutes,
  };
}
