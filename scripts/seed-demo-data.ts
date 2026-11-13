import { createAdminClient } from "@/lib/auth/admin";

export const DEMO_ACCOUNTS = [
  {
    id: "123e4567-e89b-12d3-a456-426614174001",
    email: "passenger@fairride.demo",
    password: "DemoPassword123!",
    display_name: "Demo Passenger",
    role: "passenger" as const,
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174010",
    email: "driver-alpha@fairride.demo",
    password: "DemoPassword123!",
    display_name: "Driver Alpha (Overworked)",
    role: "driver" as const,
    vehicle_label: "Sedan Alpha (KA-01-EA-1001)",
    vehicle_type: "standard",
    current_lat: 12.9770,
    current_lng: 77.5700,
    availability: "available" as const,
    completed_rides: 24,
    accepted_count: 50,
    offered_count: 55,
    idle_minutes: 2,
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174011",
    email: "driver-beta@fairride.demo",
    password: "DemoPassword123!",
    display_name: "Driver Beta (Fairness Deserving)",
    role: "driver" as const,
    vehicle_label: "Sedan Beta (KA-01-EA-1002)",
    vehicle_type: "standard",
    current_lat: 12.9800,
    current_lng: 77.5740,
    availability: "available" as const,
    completed_rides: 4,
    accepted_count: 40,
    offered_count: 42,
    idle_minutes: 45,
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174012",
    email: "driver-charlie@fairride.demo",
    password: "DemoPassword123!",
    display_name: "Driver Charlie (Downtown)",
    role: "driver" as const,
    vehicle_label: "SUV Charlie (KA-01-EA-1003)",
    vehicle_type: "premium",
    current_lat: 12.9730,
    current_lng: 77.5900,
    availability: "available" as const,
    completed_rides: 9,
    accepted_count: 25,
    offered_count: 28,
    idle_minutes: 20,
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174013",
    email: "driver-delta@fairride.demo",
    password: "DemoPassword123!",
    display_name: "Driver Delta (Tech Park)",
    role: "driver" as const,
    vehicle_label: "Hatchback Delta (KA-01-EA-1004)",
    vehicle_type: "standard",
    current_lat: 12.9860,
    current_lng: 77.6030,
    availability: "available" as const,
    completed_rides: 14,
    accepted_count: 32,
    offered_count: 35,
    idle_minutes: 12,
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174014",
    email: "driver-echo@fairride.demo",
    password: "DemoPassword123!",
    display_name: "Driver Echo (Metro North)",
    role: "driver" as const,
    vehicle_label: "Sedan Echo (KA-01-EA-1005)",
    vehicle_type: "standard",
    current_lat: 12.9890,
    current_lng: 77.5810,
    availability: "available" as const,
    completed_rides: 6,
    accepted_count: 18,
    offered_count: 20,
    idle_minutes: 35,
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174099",
    email: "admin@fairride.demo",
    password: "DemoPassword123!",
    display_name: "Chief Operations Admin",
    role: "admin" as const,
  },
];

export async function resetDemoFixtures() {
  const admin = createAdminClient();

  // 1. Ensure Auth users exist
  for (const acc of DEMO_ACCOUNTS) {
    try {
      await admin.auth.admin.createUser({
        id: acc.id,
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { display_name: acc.display_name },
      });
    } catch {
      // User may already exist in auth.users
    }
  }

  // 2. Upsert Profiles
  for (const acc of DEMO_ACCOUNTS) {
    const { error: profError } = await admin.from("profiles").upsert(
      {
        id: acc.id,
        display_name: acc.display_name,
        role: acc.role,
      },
      { onConflict: "id" }
    );
    if (profError) {
      console.error(`Error upserting profile ${acc.email}:`, profError.message);
    }
  }

  // 3. Upsert Driver Profiles
  const now = new Date();
  for (const acc of DEMO_ACCOUNTS) {
    if (acc.role === "driver" && "current_lat" in acc) {
      const idleSince = new Date(now.getTime() - (acc.idle_minutes || 5) * 60 * 1000).toISOString();
      const { error: drvError } = await admin.from("driver_profiles").upsert(
        {
          user_id: acc.id,
          vehicle_label: acc.vehicle_label,
          vehicle_type: acc.vehicle_type,
          current_lat: acc.current_lat,
          current_lng: acc.current_lng,
          availability: acc.availability,
          location_source: "simulated",
          completed_rides: acc.completed_rides,
          accepted_count: acc.accepted_count,
          offered_count: acc.offered_count,
          idle_since: idleSince,
          location_recorded_at: now.toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (drvError) {
        console.error(`Error upserting driver ${acc.email}:`, drvError.message);
      }
    }
  }

  console.log("Demo fixtures reset successfully.");
}

// Allow direct CLI execution
if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, "/") || "")) {
  resetDemoFixtures()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Error seeding demo fixtures:", err);
      process.exit(1);
    });
}
