import { useEffect, useState } from "react";

import { robotRepository, type RobotState } from "@/data/supabase/robot-repository";

const ROBOT_ID = "erwin-1";

function statusLabel(status: RobotState["status"]): string {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function RobotOperatorPage() {
  const [robot, setRobot] = useState<RobotState | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<"NEXT" | "HOME" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const state = await robotRepository.getState(ROBOT_ID);
        if (!cancelled) {
          setRobot(state);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setMessage("Could not read robot state.");
          setLoading(false);
        }
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  async function issue(command: "NEXT" | "HOME") {
    setSending(command);
    setMessage(null);
    try {
      await robotRepository.issueCommand(command, ROBOT_ID);
      setMessage(`${command} command queued.`);
    } catch {
      setMessage(`Could not queue ${command}.`);
    } finally {
      setSending(null);
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground">
      <section className="mx-auto w-full max-w-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">ERWIN DEMO CONTROL</p>
        <h1 className="mt-2 text-3xl font-black">Robot operator</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          NEXT can release/skip the current service as a staff override. Normal operation advances automatically when HRI completes the session.
        </p>

        <div className="mt-7 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Robot state</p>
          {loading && <p className="mt-3 text-muted-foreground">Loading…</p>}
          {!loading && !robot && <p className="mt-3 text-destructive">Robot state has not been initialized.</p>}
          {robot && (
            <div className="mt-3 space-y-2">
              <p className="text-2xl font-black">{statusLabel(robot.status)}</p>
              {robot.activeSessionId && <p className="break-all text-xs text-muted-foreground">Session: {robot.activeSessionId}</p>}
              {robot.errorMessage && <p className="text-sm text-destructive">{robot.errorMessage}</p>}
              <p className="text-xs text-muted-foreground">Updated {new Date(robot.updatedAt).toLocaleTimeString()}</p>
            </div>
          )}
        </div>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={() => void issue("NEXT")}
            disabled={sending !== null}
            className="h-14 w-full rounded-2xl bg-primary font-black text-primary-foreground disabled:opacity-40"
          >
            {sending === "NEXT" ? "Queueing…" : "NEXT — serve next person"}
          </button>
          <button
            type="button"
            onClick={() => void issue("HOME")}
            disabled={sending !== null}
            className="h-14 w-full rounded-2xl border border-border font-black disabled:opacity-40"
          >
            {sending === "HOME" ? "Queueing…" : "HOME — return to base"}
          </button>
        </div>

        {message && <p className="mt-5 text-center text-sm font-bold text-muted-foreground">{message}</p>}
      </section>
    </main>
  );
}
