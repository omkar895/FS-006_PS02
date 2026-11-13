import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DriverWorkspace from "@/app/driver/page";

describe("DriverWorkspace DOM Component Testing", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders driver workspace header, online toggle, and empty state", () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    } as Response);

    render(<DriverWorkspace />);

    expect(screen.getByText("Trip Operations")).toBeInTheDocument();
    expect(screen.getByText("● ONLINE")).toBeInTheDocument();
    expect(screen.getByText("No driver trips recorded yet.")).toBeInTheDocument();
  });

  it("allows driver to toggle online/offline state in DOM", () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    } as Response);

    render(<DriverWorkspace />);

    const toggleBtn = screen.getByText("● ONLINE");
    fireEvent.click(toggleBtn);
    expect(screen.getByText("○ OFFLINE")).toBeInTheDocument();
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
});
