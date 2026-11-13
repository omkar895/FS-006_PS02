/**
 * Shared formatting utilities for FairRide AI (PS2).
 */

/**
 * Format a duration in minutes into a human-readable string.
 * - Under 60 mins: "X mins"
 * - 60 mins and above: "X hr Y mins" (or "X hrs" if remainder is 0)
 * - Null / invalid: "--"
 */
export function formatDuration(minutes?: number | null): string {
  if (minutes === undefined || minutes === null || isNaN(minutes) || minutes <= 0) {
    return "--";
  }
  const rounded = Math.round(minutes);
  if (rounded < 60) {
    return `${rounded} mins`;
  }
  const hrs = Math.floor(rounded / 60);
  const remMins = rounded % 60;
  const hrLabel = hrs === 1 ? "hr" : "hrs";

  if (remMins === 0) {
    return `${hrs} ${hrLabel}`;
  }
  return `${hrs} ${hrLabel} ${remMins} mins`;
}

/**
 * Format currency in INR.
 */
export function formatCurrency(amount: number): string {
  return `₹${Math.round(amount)}`;
}
