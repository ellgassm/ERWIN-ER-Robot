import { useEffect, useState } from "react";

import { sessionRepository } from "@/data/supabase/session-repository";
import type { ERWINSession } from "@/shared/domain";

export interface SessionPollState {
  session: ERWINSession | null;
  queuePosition: number | null;
  loading: boolean;
  error: Error | null;
}

export function useSession(sessionId: string | null, intervalMs = 2_500): SessionPollState {
  const [state, setState] = useState<SessionPollState>({
    session: null,
    queuePosition: null,
    loading: Boolean(sessionId),
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    if (!sessionId) {
      setState({ session: null, queuePosition: null, loading: false, error: null });
      return () => {
        cancelled = true;
      };
    }

    const poll = async () => {
      try {
        const session = await sessionRepository.findById(sessionId);
        if (!session) throw new Error("Session was not found.");

        let queuePosition: number | null = null;
        if (session.status === "requested" || session.status === "queued") {
          const queued = await sessionRepository.findQueued();
          const index = queued.findIndex((candidate) => candidate.sessionId === sessionId);
          queuePosition = index >= 0 ? index + 1 : null;
        }

        if (!cancelled) setState({ session, queuePosition, loading: false, error: null });
      } catch (error: unknown) {
        if (!cancelled) {
          setState({
            session: null,
            queuePosition: null,
            loading: false,
            error: error instanceof Error ? error : new Error("Unable to load session."),
          });
        }
      }
    };

    void poll();
    const timer = window.setInterval(() => void poll(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [intervalMs, sessionId]);

  return state;
}
