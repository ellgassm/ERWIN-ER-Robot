import { sessionRepository } from "@/data/supabase/session-repository";

const POLL_INTERVAL_MS = 2_000;
const ARRIVAL_DELAY_MS = 4_000;
const LOCK_KEY = "erwin.mock-robot.lock";
const ACTIVE_SESSION_KEY = "erwin.mock-robot.active-session";

interface RobotLock {
  owner: string;
  expiresAt: number;
}

function readLock(): RobotLock | null {
  try {
    const raw = window.localStorage.getItem(LOCK_KEY);
    return raw ? (JSON.parse(raw) as RobotLock) : null;
  } catch {
    return null;
  }
}

function writeLock(lock: RobotLock): void {
  window.localStorage.setItem(LOCK_KEY, JSON.stringify(lock));
}

/** Local application-level stand-in for the future robot bridge. */
export class MockRobotController {
  private readonly owner = `${Date.now()}-${Math.random()}`;
  private pollTimer: number | undefined;
  private arrivalTimer: number | undefined;

  start(): void {
    if (this.pollTimer !== undefined) return;
    void this.poll();
    this.pollTimer = window.setInterval(() => void this.poll(), POLL_INTERVAL_MS);
  }

  stop(): void {
    if (this.pollTimer !== undefined) window.clearInterval(this.pollTimer);
    if (this.arrivalTimer !== undefined) window.clearTimeout(this.arrivalTimer);
    this.pollTimer = undefined;
    this.arrivalTimer = undefined;

    const lock = readLock();
    if (lock?.owner === this.owner) window.localStorage.removeItem(LOCK_KEY);
  }

  private tryAcquireLock(): boolean {
    const current = readLock();
    if (current && current.owner !== this.owner && current.expiresAt > Date.now()) return false;
    writeLock({ owner: this.owner, expiresAt: Date.now() + POLL_INTERVAL_MS * 2 });
    return readLock()?.owner === this.owner;
  }

  private async poll(): Promise<void> {
    try {
      if (!this.tryAcquireLock()) return;

      const activeSessionId = window.localStorage.getItem(ACTIVE_SESSION_KEY);
      if (activeSessionId) {
        const activeSession = await sessionRepository.findById(activeSessionId);
        if (!activeSession || activeSession.status === "completed" || activeSession.status === "cancelled") {
          window.localStorage.removeItem(ACTIVE_SESSION_KEY);
        } else {
          if (activeSession.status === "navigating") this.scheduleArrival(activeSession.sessionId);
          return;
        }
      }

      const queued = await sessionRepository.findQueued();
      const next = queued[0];
      if (!next) return;

      const navigating = await sessionRepository.updateStatus(next.sessionId, "navigating");
      window.localStorage.setItem(ACTIVE_SESSION_KEY, navigating.sessionId);
      this.scheduleArrival(navigating.sessionId);
    } catch {
      // The patient poller reports failures to the UI; the mock retries on its next interval.
    }
  }

  private scheduleArrival(sessionId: string): void {
    if (this.arrivalTimer !== undefined) return;
    this.arrivalTimer = window.setTimeout(async () => {
      this.arrivalTimer = undefined;
      const session = await sessionRepository.findById(sessionId);
      if (session?.status === "navigating") {
        await sessionRepository.updateStatus(sessionId, "interacting");
      }
    }, ARRIVAL_DELAY_MS);
  }
}

export const mockRobot = new MockRobotController();
