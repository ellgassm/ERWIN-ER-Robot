export const SESSION_STATUSES = [
  "requested",
  "queued",
  "navigating",
  "interacting",
  "measuring",
  "review",
  "completed",
  "cancelled",
] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const TERMINAL_SESSION_STATUSES = ["completed", "cancelled"] as const;

export function isTerminalSessionStatus(status: SessionStatus): boolean {
  return TERMINAL_SESSION_STATUSES.includes(status as (typeof TERMINAL_SESSION_STATUSES)[number]);
}
