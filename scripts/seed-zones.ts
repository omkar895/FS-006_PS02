import { createAdminClient } from "@/lib/auth/admin";

export const SEED_ZONES = [
  { slug: "downtown-central", name: "Downtown Central", center_lat: 12.9716, center_lng: 77.5946, radius_km: 2.5 },
  { slug: "tech-park-east", name: "Tech Park East", center_lat: 12.9850, center_lng: 77.6050, radius_km: 3.0 },
  { slug: "metro-hub-north", name: "Metro Hub North", center_lat: 12.9900, center_lng: 77.5800, radius_km: 2.0 },
  { slug: "airport-corridor", name: "Airport Corridor", center_lat: 13.0500, center_lng: 77.6200, radius_km: 5.0 },
  { slug: "residential-south", name: "Residential South", center_lat: 12.9300, center_lng: 77.5850, radius_km: 3.5 },
  { slug: "university-west", name: "University West", center_lat: 12.9600, center_lng: 77.5400, radius_km: 2.5 },
];

export async function seedZones() {
  const admin = createAdminClient();
  const { data, error } = await admin.from("zones").upsert(
    SEED_ZONES.map((z) => ({
      slug: z.slug,
      name: z.name,
      center_lat: z.center_lat,
      center_lng: z.center_lng,
      radius_km: z.radius_km,
      is_active: true,
    })),
    { onConflict: "slug" }
  );

  if (error) {
    throw new Error(`Failed to seed zones: ${error.message}`);
  }
  return data;
}

