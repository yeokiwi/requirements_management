// ---------------------------------------------------------------------------
// Date formatting utilities
// ---------------------------------------------------------------------------

export type DateFormat = "iso" | "us" | "eu";

/**
 * Format an ISO 8601 timestamp string.
 *
 * - `iso` → "2025-03-15T14:30:00.000Z"  (passthrough / normalised)
 * - `us`  → "03/15/2025 2:30 PM"
 * - `eu`  → "15.03.2025 14:30"
 */
export function formatDate(isoString: string, format: DateFormat): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  switch (format) {
    case "iso":
      return date.toISOString();

    case "us": {
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
    }

    case "eu": {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    default:
      return date.toISOString();
  }
}

/**
 * Return a human-readable relative time string like "2 hours ago" or "3 days ago".
 */
export function formatRelative(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const nowMs = Date.now();
  const diffMs = nowMs - date.getTime();
  const absDiff = Math.abs(diffMs);
  const isFuture = diffMs < 0;

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let label: string;

  if (seconds < 5) {
    return "just now";
  } else if (seconds < 60) {
    label = `${seconds} second${seconds !== 1 ? "s" : ""}`;
  } else if (minutes < 60) {
    label = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else if (hours < 24) {
    label = `${hours} hour${hours !== 1 ? "s" : ""}`;
  } else if (days < 7) {
    label = `${days} day${days !== 1 ? "s" : ""}`;
  } else if (weeks < 5) {
    label = `${weeks} week${weeks !== 1 ? "s" : ""}`;
  } else if (months < 12) {
    label = `${months} month${months !== 1 ? "s" : ""}`;
  } else {
    label = `${years} year${years !== 1 ? "s" : ""}`;
  }

  return isFuture ? `in ${label}` : `${label} ago`;
}

/**
 * Return the current time as an ISO 8601 timestamp string.
 */
export function now(): string {
  return new Date().toISOString();
}
