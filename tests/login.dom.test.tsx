import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/login/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue("passenger") }),
}));

// Mock Supabase client
const mockSignInWithOAuth = vi.fn();
const mockSignInWithPassword = vi.fn();

vi.mock("@/lib/auth/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

describe("Login Page & Google Authorization DOM Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders role tabs, 1-click demo login, and Continue with Google button", () => {
    render(<LoginPage />);

    expect(screen.getByText("Sign In to Continue")).toBeInTheDocument();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    expect(screen.getByText("Fast Demo Access")).toBeInTheDocument();
    expect(screen.getByText("⚡ Sign In as Demo Passenger")).toBeInTheDocument();
  });

  it("triggers Google OAuth initiation when Continue with Google is clicked", async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({ data: { url: "https://accounts.google.com" }, error: null });

    render(<LoginPage />);

    const googleBtn = screen.getByRole("button", { name: /Continue with Google/i });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "google",
          options: expect.objectContaining({
            redirectTo: expect.stringContaining("/auth/callback"),
          }),
        })
      );
    });
  });

  it("displays helpful error message when Google OAuth provider is not configured", async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({
      data: null,
      error: new Error("Unsupported provider: provider is not enabled"),
    });

    render(<LoginPage />);

    const googleBtn = screen.getByRole("button", { name: /Continue with Google/i });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(screen.getByText(/Unsupported provider/i)).toBeInTheDocument();
    });
  });
});
