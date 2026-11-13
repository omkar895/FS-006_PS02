import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PassengerWorkspace from "@/app/passenger/page";
import DriverWorkspace from "@/app/driver/page";

// Mock the dynamic map component for headless DOM testing
vi.mock("@/components/maps/map-wrapper", () => ({
  default: () => <div data-testid="mocked-operations-map">Operations Map Mock</div>,
}));

// Mock OSRM road router
vi.mock("@/lib/services/routing-service", () => ({
  fetchRealRoadRoute: vi.fn().mockResolvedValue({
    coordinates: [
      [12.9716, 77.5946],
      [12.9730, 77.5960],
      [12.9750, 77.5980],
    ],
    distanceKm: 2.5,
    durationMinutes: 7,
    isRealRoad: true,
  }),
}));

describe("Real-Time Flow 60-Second End-to-End DOM Test", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("executes the full real-time journey: passenger booking, driver 30s offer & acceptance, and live street driving simulation", async () => {
    let mockRideState = {
      id: "ride-live-realtime-1",
      status: "requested",
      pickup_label: "MG Road Metro Hub",
      pickup_lat: 12.9716,
      pickup_lng: 77.5946,
      destination_label: "Indiranagar 100ft Road",
      destination_lat: 12.9784,
      destination_lng: 77.6408,
      distance_km: 4.8,
      fare_estimate: 122,
      trip_eta_minutes: 10,
      pickup_eta_minutes: 4,
      assigned_driver_id: "123e4567-e89b-12d3-a456-426614174010",
      match_metadata: {
        score: 0.88,
        scoreContributions: {
          eta: 0.28,
          idle: 0.22,
          distance: 0.17,
          workload: 0.13,
          reliability: 0.08,
        },
        explanation: "Driver Alpha was selected balancing idle time and pickup proximity.",
      },
    };

    const telemetryCalls: Array<{ driverId: string; lat: number; lng: number }> = [];

    // Global fetch mock simulating Supabase and API routes
    vi.spyOn(global, "fetch").mockImplementation((url, init) => {
      const urlStr = typeof url === "string" ? url : url.toString();

      // Drivers nearby
      if (urlStr.includes("/api/drivers/nearby")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  userId: "123e4567-e89b-12d3-a456-426614174010",
                  vehicleLabel: "Sedan Alpha (KA-01-EA-1001)",
                  lat: 12.972,
                  lng: 77.595,
                  distanceKm: 0.5,
                  estimatedPickupMinutes: 3,
                },
              ],
            }),
        } as Response);
      }

      // Telemetry ingestion
      if (urlStr.includes("/api/drivers/telemetry")) {
        if (init?.body) {
          telemetryCalls.push(JSON.parse(init.body as string));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response);
      }

      // Driver acceptance response
      if (urlStr.includes("/api/rides/") && urlStr.includes("/respond")) {
        mockRideState = { ...mockRideState, status: "accepted" };
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockRideState }),
        } as Response);
      }

      // Passenger create ride request
      if (urlStr.includes("/api/rides") && init?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockRideState }),
        } as Response);
      }

      // Default GET /api/rides
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [mockRideState] }),
      } as Response);
    });

    // ----------------------------------------------------
    // STEP 1: Passenger Portal Renders & Submits Ride
    // ----------------------------------------------------
    const { unmount: unmountPassenger } = render(<PassengerWorkspace />);

    expect(screen.getByText("Book & Track Rides")).toBeInTheDocument();
    expect(screen.getByTestId("mocked-operations-map")).toBeInTheDocument();

    const bookButton = screen.getByRole("button", { name: /Request Ride Now/i });
    expect(bookButton).toBeInTheDocument();
    fireEvent.click(bookButton);

    unmountPassenger();

    // ----------------------------------------------------
    // STEP 2: Driver Terminal Receives Offer with 30s Timer
    // ----------------------------------------------------
    const { unmount: unmountDriver } = render(<DriverWorkspace />);

    await waitFor(() => {
      expect(screen.getByText("★ New Dispatch Offer Received")).toBeInTheDocument();
      expect(screen.getByText(/to respond/i)).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /MG Road Metro Hub → Indiranagar 100ft Road/i })
      ).toBeInTheDocument();
    });

    // ----------------------------------------------------
    // STEP 3: Driver Accepts Ride
    // ----------------------------------------------------
    const acceptBtn = screen.getByRole("button", { name: /Accept Ride/i });
    expect(acceptBtn).toBeInTheDocument();
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(screen.getByText("Offer successfully accepted.")).toBeInTheDocument();
    });

    // Update state to accepted
    mockRideState = { ...mockRideState, status: "accepted" };
    unmountDriver();

    // ----------------------------------------------------
    // STEP 4: Driver Starts Live Road Driving Telemetry
    // ----------------------------------------------------
    render(<DriverWorkspace />);

    await waitFor(() => {
      expect(screen.getByText("Current Trip Lifecycle")).toBeInTheDocument();
      expect(screen.getByText("Live Street Driving Telemetry")).toBeInTheDocument();
    });

    const startDriveBtn = await screen.findByRole("button", {
      name: /Start Live Road Driving/i,
    });

    await waitFor(() => {
      expect(startDriveBtn).not.toBeDisabled();
    });

    fireEvent.click(startDriveBtn);

    // Verify button switches to active drive state
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Pause Simulated Driving/i })).toBeInTheDocument();
    });
  });
});
