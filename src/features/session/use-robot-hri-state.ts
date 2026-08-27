import { useEffect, useState } from "react";

const ROSBRIDGE_URL = import.meta.env.VITE_ROSBRIDGE_URL || "";
const DISPLAY_TOPIC = import.meta.env.VITE_ERWIN_DISPLAY_TOPIC || "/erwin/display_state";

export function useRobotHriState(sessionId: string | null): string | null {
  const [state, setState] = useState<string | null>(null);

  useEffect(() => {
    setState(null);
    if (!sessionId || !ROSBRIDGE_URL) return;

    const socket = new WebSocket(ROSBRIDGE_URL);
    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({
        op: "subscribe",
        topic: DISPLAY_TOPIC,
        type: "std_msgs/msg/String",
        throttle_rate: 0,
      }));
    });
    socket.addEventListener("message", (event) => {
      try {
        const envelope = JSON.parse(event.data) as { op?: string; topic?: string; msg?: { data?: string } };
        if (envelope.op !== "publish" || envelope.topic !== DISPLAY_TOPIC || typeof envelope.msg?.data !== "string") return;
        const message = JSON.parse(envelope.msg.data) as { session_id?: string | null; state?: string };
        if (message.session_id === sessionId && typeof message.state === "string") setState(message.state);
      } catch {
        // Ignore malformed or unrelated rosbridge messages.
      }
    });

    return () => socket.close();
  }, [sessionId]);

  return state;
}
