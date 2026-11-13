import { z } from "zod";

export const UserRoleSchema = z.enum(["passenger", "driver", "admin"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const DriverAvailabilitySchema = z.enum(["offline", "available", "busy"]);
export type DriverAvailability = z.infer<typeof DriverAvailabilitySchema>;

export const RideStatusSchema = z.enum([
  "requested",
  "accepted",
  "arriving",
  "ongoing",
  "completed",
  "cancelled",
  "reassigning",
  "unassigned",
  "expired",
]);
export type RideStatus = z.infer<typeof RideStatusSchema>;

export const PoolStatusSchema = z.enum([
  "proposed",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);
export type PoolStatus = z.infer<typeof PoolStatusSchema>;

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().min(2).max(100),
  role: UserRoleSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const DriverProfileSchema = z.object({
  user_id: z.string().uuid(),
  availability: DriverAvailabilitySchema,
  vehicle_label: z.string(),
  vehicle_type: z.string(),
  vehicle_registration_label: z.string().nullable().optional(),
  current_lat: z.number().min(-90).max(90).nullable().optional(),
  current_lng: z.number().min(-180).max(180).nullable().optional(),
  location_source: z.enum(["simulated", "browser_geolocation"]),
  location_recorded_at: z.string().datetime().nullable().optional(),
  online_since: z.string().datetime().nullable().optional(),
  idle_since: z.string().datetime().nullable().optional(),
  accepted_count: z.number().int().nonnegative(),
  offered_count: z.number().int().nonnegative(),
  completed_rides: z.number().int().nonnegative(),
  active_minutes_today: z.number().int().nonnegative(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type DriverProfile = z.infer<typeof DriverProfileSchema>;

export const ZoneSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  center_lat: z.number().min(-90).max(90),
  center_lng: z.number().min(-180).max(180),
  radius_km: z.number().positive(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
});
export type Zone = z.infer<typeof ZoneSchema>;

export const RideSchema = z.object({
  id: z.string().uuid(),
  passenger_id: z.string().uuid(),
  assigned_driver_id: z.string().uuid().nullable().optional(),
  pickup_label: z.string(),
  pickup_lat: z.number().min(-90).max(90),
  pickup_lng: z.number().min(-180).max(180),
  destination_label: z.string(),
  destination_lat: z.number().min(-90).max(90),
  destination_lng: z.number().min(-180).max(180),
  status: RideStatusSchema,
  distance_km: z.number().nonnegative(),
  pickup_eta_minutes: z.number().nonnegative().nullable().optional(),
  trip_eta_minutes: z.number().nonnegative().nullable().optional(),
  base_fare: z.number().nonnegative(),
  distance_fare: z.number().nonnegative(),
  surge_multiplier: z.number().min(1.0).max(3.0),
  fare_estimate: z.number().nonnegative(),
  fare_final: z.number().nonnegative().nullable().optional(),
  requested_at: z.string().datetime(),
  accepted_at: z.string().datetime().nullable().optional(),
  arriving_at: z.string().datetime().nullable().optional(),
  started_at: z.string().datetime().nullable().optional(),
  completed_at: z.string().datetime().nullable().optional(),
  request_expires_at: z.string().datetime().nullable().optional(),
  match_metadata: z.record(z.string(), z.unknown()),
  idempotency_key: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Ride = z.infer<typeof RideSchema>;

