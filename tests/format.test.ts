import { describe, it, expect } from "vitest";
import { formatDuration } from "@/lib/utils/format";

describe("formatDuration utility", () => {
  it("handles null, undefined and zero", () => {
    expect(formatDuration(null)).toBe("--");
    expect(formatDuration(undefined)).toBe("--");
    expect(formatDuration(0)).toBe("--");
    expect(formatDuration(-5)).toBe("--");
  });

  it("formats durations under 60 minutes as mins", () => {
    expect(formatDuration(8)).toBe("8 mins");
    expect(formatDuration(15.4)).toBe("15 mins");
    expect(formatDuration(59)).toBe("59 mins");
  });

  it("formats exact hours without minutes", () => {
    expect(formatDuration(60)).toBe("1 hr");
    expect(formatDuration(120)).toBe("2 hrs");
    expect(formatDuration(180)).toBe("3 hrs");
  });

  it("formats hours and minutes for long/intercity trips", () => {
    expect(formatDuration(65)).toBe("1 hr 5 mins");
    expect(formatDuration(90)).toBe("1 hr 30 mins");
    expect(formatDuration(342)).toBe("5 hrs 42 mins");
    expect(formatDuration(485)).toBe("8 hrs 5 mins");
  });
});
