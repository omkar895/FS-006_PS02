-- ============================================================================
-- FAIRRIDE AI — PRODUCTION MIGRATION 001
-- Schemas, Constraints, Indexes, Functions, and Row Level Security
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('passenger', 'driver', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE driver_availability AS ENUM ('offline', 'available', 'busy');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ride_status AS ENUM (
        'requested',
        'accepted',
        'arriving',
        'ongoing',
        'completed',
        'cancelled',
        'reassigning',
        'unassigned',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pool_status AS ENUM (
        'proposed',
        'confirmed',
        'in_progress',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'passenger',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Trigger to prevent self-promotion / role tampering directly by client
CREATE OR REPLACE FUNCTION public.handle_profile_role_update_protection()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.role IS DISTINCT FROM NEW.role) AND (auth.role() <> 'service_role') THEN
        RAISE EXCEPTION 'Role elevation is restricted to privileged server administrative procedures';
    END IF;
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profile_role_update_protection();

-- 4. DRIVER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.driver_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    availability driver_availability NOT NULL DEFAULT 'offline',
    vehicle_label TEXT NOT NULL DEFAULT 'Standard Sedan',
    vehicle_type TEXT NOT NULL DEFAULT 'standard',
    vehicle_registration_label TEXT DEFAULT 'SIM-VEHICLE',
    current_lat DOUBLE PRECISION CHECK (current_lat IS NULL OR (current_lat >= -90.0 AND current_lat <= 90.0)),
    current_lng DOUBLE PRECISION CHECK (current_lng IS NULL OR (current_lng >= -180.0 AND current_lng <= 180.0)),
    location_source TEXT NOT NULL DEFAULT 'simulated' CHECK (location_source IN ('simulated', 'browser_geolocation')),
    location_recorded_at TIMESTAMPTZ,
    online_since TIMESTAMPTZ,
    idle_since TIMESTAMPTZ,
    accepted_count INTEGER NOT NULL DEFAULT 0 CHECK (accepted_count >= 0),
    offered_count INTEGER NOT NULL DEFAULT 0 CHECK (offered_count >= 0),
    completed_rides INTEGER NOT NULL DEFAULT 0 CHECK (completed_rides >= 0),
    active_minutes_today INTEGER NOT NULL DEFAULT 0 CHECK (active_minutes_today >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. ZONES TABLE
CREATE TABLE IF NOT EXISTS public.zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    center_lat DOUBLE PRECISION NOT NULL CHECK (center_lat >= -90.0 AND center_lat <= 90.0),
    center_lng DOUBLE PRECISION NOT NULL CHECK (center_lng >= -180.0 AND center_lng <= 180.0),
    radius_km NUMERIC(7,2) NOT NULL DEFAULT 2.0 CHECK (radius_km > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. RIDES TABLE
CREATE TABLE IF NOT EXISTS public.rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_id UUID NOT NULL REFERENCES public.profiles(id),
    assigned_driver_id UUID REFERENCES public.driver_profiles(user_id),
    pickup_label TEXT NOT NULL,
    pickup_lat DOUBLE PRECISION NOT NULL CHECK (pickup_lat >= -90.0 AND pickup_lat <= 90.0),
    pickup_lng DOUBLE PRECISION NOT NULL CHECK (pickup_lng >= -180.0 AND pickup_lng <= 180.0),
    destination_label TEXT NOT NULL,
    destination_lat DOUBLE PRECISION NOT NULL CHECK (destination_lat >= -90.0 AND destination_lat <= 90.0),
    destination_lng DOUBLE PRECISION NOT NULL CHECK (destination_lng >= -180.0 AND destination_lng <= 180.0),
    status ride_status NOT NULL DEFAULT 'requested',
    distance_km NUMERIC(8,2) NOT NULL CHECK (distance_km >= 0),
    pickup_eta_minutes NUMERIC(7,2) CHECK (pickup_eta_minutes IS NULL OR pickup_eta_minutes >= 0),
    trip_eta_minutes NUMERIC(7,2) CHECK (trip_eta_minutes IS NULL OR trip_eta_minutes >= 0),
    base_fare NUMERIC(10,2) NOT NULL CHECK (base_fare >= 0),
    distance_fare NUMERIC(10,2) NOT NULL CHECK (distance_fare >= 0),
    surge_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00 CHECK (surge_multiplier >= 1.00 AND surge_multiplier <= 3.00),
    fare_estimate NUMERIC(10,2) NOT NULL CHECK (fare_estimate >= 0),
    fare_final NUMERIC(10,2) CHECK (fare_final IS NULL OR fare_final >= 0),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    accepted_at TIMESTAMPTZ,
    arriving_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    request_expires_at TIMESTAMPTZ,
    match_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    idempotency_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Invariant: One active assignment per driver
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_ride_per_driver 
ON public.rides(assigned_driver_id) 
WHERE status IN ('accepted', 'arriving', 'ongoing');

-- Invariant: Idempotency per passenger
CREATE UNIQUE INDEX IF NOT EXISTS idx_passenger_idempotency 
ON public.rides(passenger_id, idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- 7. RIDE EVENTS TABLE (Append-Only Audit)
CREATE TABLE IF NOT EXISTS public.ride_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    from_status ride_status,
    to_status ride_status,
    actor_id UUID REFERENCES public.profiles(id),
    actor_role TEXT,
    description TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 8. DEMAND FORECASTS TABLE
CREATE TABLE IF NOT EXISTS public.demand_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
    forecast_for TIMESTAMPTZ NOT NULL,
    predicted_requests NUMERIC(10,2) NOT NULL CHECK (predicted_requests >= 0),
    actual_requests INTEGER CHECK (actual_requests IS NULL OR actual_requests >= 0),
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    source_label TEXT NOT NULL DEFAULT 'SIMULATED',
    mae NUMERIC(10,4),
    rmse NUMERIC(10,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_zone_forecast_model UNIQUE (zone_id, forecast_for, model_version)
);

-- 9. RIDE POOLS & MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.ride_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.driver_profiles(user_id),
    status pool_status NOT NULL DEFAULT 'proposed',
    route_sequence JSONB NOT NULL,
    total_distance_km NUMERIC(8,2) NOT NULL CHECK (total_distance_km >= 0),
    total_eta_minutes NUMERIC(8,2) NOT NULL CHECK (total_eta_minutes >= 0),
    shared_fare NUMERIC(10,2) NOT NULL CHECK (shared_fare >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.ride_pool_members (
    pool_id UUID NOT NULL REFERENCES public.ride_pools(id) ON DELETE CASCADE,
    ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    passenger_index INTEGER NOT NULL CHECK (passenger_index >= 0),
    separate_fare NUMERIC(10,2) NOT NULL CHECK (separate_fare >= 0),
    pooled_fare NUMERIC(10,2) NOT NULL CHECK (pooled_fare >= 0),
    added_time_minutes NUMERIC(8,2) NOT NULL CHECK (added_time_minutes >= 0),
    PRIMARY KEY (pool_id, ride_id)
);

-- 10. SIMULATION RUNS & RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.simulation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario TEXT NOT NULL,
    request_count INTEGER NOT NULL CHECK (request_count > 0),
    seed INTEGER NOT NULL,
    algorithm_version TEXT NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.simulation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
    algorithm_name TEXT NOT NULL,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    per_driver_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 11. INDEXES
CREATE INDEX IF NOT EXISTS idx_rides_passenger_requested ON public.rides(passenger_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_driver_requested ON public.rides(assigned_driver_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_status_requested ON public.rides(status, requested_at);
CREATE INDEX IF NOT EXISTS idx_ride_events_ride_created ON public.ride_events(ride_id, created_at);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_avail_loc ON public.driver_profiles(availability, location_recorded_at);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_zone_time ON public.demand_forecasts(zone_id, forecast_for DESC);
CREATE INDEX IF NOT EXISTS idx_zones_slug ON public.zones(slug);

-- 12. ROW LEVEL SECURITY (RLS) ENABLEMENT
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_pool_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_results ENABLE ROW LEVEL SECURITY;

-- 13. RLS POLICIES

-- Helper functions for role detection
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles:
-- 1) Any authenticated user can read their own profile
CREATE POLICY "profiles_read_own" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.current_user_role() = 'admin');

-- 2) Users can update their own display_name (role is protected by trigger)
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Driver profiles:
-- 1) Authenticated passengers and drivers can view active driver projection (lat, lng, availability)
CREATE POLICY "driver_profiles_read_active" ON public.driver_profiles
    FOR SELECT TO authenticated
    USING (true);

-- 2) Drivers can update only their own driver profile
CREATE POLICY "driver_profiles_update_own" ON public.driver_profiles
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Zones:
-- 1) Read-only for authenticated users
CREATE POLICY "zones_read_all" ON public.zones
    FOR SELECT TO authenticated
    USING (is_active = true OR public.current_user_role() = 'admin');

-- 2) Admin manage
CREATE POLICY "zones_admin_all" ON public.zones
    FOR ALL TO authenticated
    USING (public.current_user_role() = 'admin');

-- Rides:
-- 1) Passengers can read their own rides
-- 2) Drivers can read assigned or offered rides
-- 3) Admin can read all rides
CREATE POLICY "rides_select_role_scoped" ON public.rides
    FOR SELECT TO authenticated
    USING (
        passenger_id = auth.uid()
        OR assigned_driver_id = auth.uid()
        OR public.current_user_role() = 'admin'
    );

-- State transitions and matching occur via privileged server handlers.
-- Direct insert allowed for passenger creating their ride:
CREATE POLICY "rides_insert_passenger" ON public.rides
    FOR INSERT TO authenticated
    WITH CHECK (passenger_id = auth.uid());

-- Ride Events:
-- Read events only if user is the passenger, assigned driver, or admin
CREATE POLICY "ride_events_select_scoped" ON public.ride_events
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.rides r
            WHERE r.id = ride_events.ride_id
            AND (r.passenger_id = auth.uid() OR r.assigned_driver_id = auth.uid() OR public.current_user_role() = 'admin')
        )
    );

-- Demand Forecasts:
-- Readable by authenticated users; managed by service role or admin
CREATE POLICY "forecasts_read_authenticated" ON public.demand_forecasts
    FOR SELECT TO authenticated
    USING (true);

-- Ride Pools & Members:
CREATE POLICY "pools_read_scoped" ON public.ride_pools
    FOR SELECT TO authenticated
    USING (
        driver_id = auth.uid()
        OR public.current_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.ride_pool_members rpm
            JOIN public.rides r ON r.id = rpm.ride_id
            WHERE rpm.pool_id = ride_pools.id AND r.passenger_id = auth.uid()
        )
    );

CREATE POLICY "pool_members_read_scoped" ON public.ride_pool_members
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.rides r
            WHERE r.id = ride_pool_members.ride_id
            AND (r.passenger_id = auth.uid() OR r.assigned_driver_id = auth.uid() OR public.current_user_role() = 'admin')
        )
    );

-- Simulation:
-- Read and create restricted to admins
CREATE POLICY "simulation_runs_admin" ON public.simulation_runs
    FOR ALL TO authenticated
    USING (public.current_user_role() = 'admin');

CREATE POLICY "simulation_results_admin" ON public.simulation_results
    FOR ALL TO authenticated
    USING (public.current_user_role() = 'admin');
