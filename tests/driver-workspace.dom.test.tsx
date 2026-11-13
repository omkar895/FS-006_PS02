import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DriverWorkspace from "@/app/driver/page";

describe("DriverWorkspace DOM Component Testing", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders driver workspace header, online toggle, and empty state", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    } as Response);

    render(<DriverWorkspace />);

    await waitFor(() => {
      expect(screen.getByText("Trip Operations")).toBeInTheDocument();
      expect(screen.getByText("● ONLINE")).toBeInTheDocument();
      expect(screen.getByText("No driver trips recorded yet.")).toBeInTheDocument();
    });
  });

  it("allows driver to toggle online/offline state in DOM", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    } as Response);

    render(<DriverWorkspace />);

    await waitFor(() => {
      expect(screen.getByText("● ONLINE")).toBeInTheDocument();
    });

    const toggleBtn = screen.getByText("● ONLINE");
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(screen.getByText("○ OFFLINE")).toBeInTheDocument();
    });
  });

  it("renders dispatch offer and handles accept action in DOM", async () => {
    const mockOfferRide = {
      id: "ride-offer-1",
      status: "requested",
      pickup_label: "City Airport",
      destination_label: "Tech Hub",
      distance_km: 12.5,
      fare_estimate: 240,
      pickup_eta_minutes: 5,
    };

    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((url, init) => {
      if (init && init.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { ...mockOfferRide, status: "accepted" } }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [mockOfferRide] }),
      } as Response);
    });

    render(<DriverWorkspace />);

    await waitFor(() => {
      expect(screen.getByText("★ New Dispatch Offer Received")).toBeInTheDocument();
      expect(screen.getAllByText("City Airport → Tech Hub").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("₹240")).toBeInTheDocument();
    });

    const acceptBtn = screen.getByRole("button", { name: /Accept Ride/i });
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/rides/ride-offer-1/respond",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ decision: "accept" }),
        })
      );
    });
  });

  it("renders driver welfare metrics and handles 15m break pause", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    } as Response);

    render(<DriverWorkspace />);

    await waitFor(() => {
      expect(screen.getByText("Driver Welfare & Daily Equity Safeguard")).toBeInTheDocument();
      expect(screen.getByText("Workload Fairness")).toBeInTheDocument();
      expect(screen.getByText("Fleet Parity")).toBeInTheDocument();
      expect(screen.getByText("Shift Fatigue")).toBeInTheDocument();
    });

    const breakBtn = screen.getByText("Take 15m Break");
    fireEvent.click(breakBtn);

    await waitFor(() => {
      expect(screen.getByText("☕ On Break (Paused)")).toBeInTheDocument();
      expect(screen.getByText(/Break active\. New dispatch offers paused for rest\./i)).toBeInTheDocument();
    });
  });

  it("displays high demand repositioning banner and triggers navigation", async () => {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      if (String(url).includes("/api/zones/intelligence")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                zoneIntelligence: [
                  {
                    zoneSlug: "residential-south",
                    predictedDemand30m: 35.0,
                    availableDriversSupply: 10,
                    demandSupplyRatio: 3.5,
                    simulatedSurgeMultiplier: 1.8,
                    repositionRecommendation: {
                      needed: true,
                      deficit: 25,
                      reason: "Peak demand surge in Koramangala.",
                    },
                  },
                ],
              },
            }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      } as Response);
    });

    render(<DriverWorkspace />);

    await waitFor(() => {
      expect(screen.getByText(/High Demand Detected in Koramangala \/ HSR South/i)).toBeInTheDocument();
      expect(screen.getByText("1.8x Surge")).toBeInTheDocument();
      expect(screen.getByText("+25 Driver Deficit")).toBeInTheDocument();
    });

    const repoBtn = screen.getByRole("button", { name: /Reposition Now & Navigate/i });
    fireEvent.click(repoBtn);

    await waitFor(() => {
      expect(screen.getByText(/En route to Koramangala \/ HSR South/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Arrived at Zone/i })).toBeInTheDocument();
    });
  });
});
