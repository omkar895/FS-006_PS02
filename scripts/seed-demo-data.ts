import { createAdminClient } from "@/lib/auth/admin";

export const DEMO_PROFILES = [
  {
    id: "123e4567-e89b-12d3-a456-426614174001",
    display_name: "Demo Passenger (A)",
    role: "passenger",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174002",
    display_name: "Demo Passenger (B)",
    role: "passenger",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174010",
    display_name: "Driver Alpha (Overworked)",
    role: "driver",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174011",
    display_name: "Driver Beta (Fairness Deserving)",
    role: "driver",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174099",
    display_name: "Chief Operations Admin",
    role: "admin",
  },
];

export const DEMO_DRIVERS = [
  {
    user_id: "123e4567-e89b-12d3-a456-426614174010",
    vehicle_label: "Sedan Alpha",
    vehicle_type: "standard",
    current_lat: 12.9720,
    current_lng: 77.5950,
    availability: "available",
    location_source: "simulated",
    completed_rides: 18,
    accepted_count: 50,
    offered_count: 55,
    idle_since: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins idle
    location_recorded_at: new Date().toISOString(),
  },
  {
    user_id: "123e4567-e89b-12d3-a456-426614174011",
    vehicle_label: "Sedan Beta",
    vehicle_type: "standard",
    current_lat: 12.9780,
    current_lng: 77.5970,
    availability: "available",
    location_source: "simulated",
    completed_rides: 3,
    accepted_count: 40,
    offered_count: 42,
    idle_since: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 mins idle
    location_recorded_at: new Date().toISOString(),
  },
];

export async function resetDemoFixtures() {
  const admin = createAdminClient();

  // Reset profiles
  for (const prof of DEMO_PROFILES) {
    await admin.from("profiles").upsert(prof, { onConflict: "id" });
  }

  // Reset driver fleet
  for (const drv of DEMO_DRIVERS) {
    await admin.from("driver_profiles").upsert(drv, { onConflict: "user_id" });
  }

  console.log("Demo fixtures reset successfully.");
}
