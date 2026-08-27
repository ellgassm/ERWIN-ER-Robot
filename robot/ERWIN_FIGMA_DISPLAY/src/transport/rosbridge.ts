import type { DisplayStateMessage, ErwinDisplayState } from "@/types/erwin";

interface RosbridgePublishMessage {
  op?: string;
  topic?: string;
  msg?: { data?: string };
}

const DISPLAY_STATES = new Set<ErwinDisplayState>([
  "idle", "queued", "navigating", "arriving", "greeting", "choosing_assistance",
  "ask_breathing_followup", "ask_vitals_followup", "display_vitals",
  "sensor_setup", "measuring_heart_rate", "breathing_exercise", "pain_scale",
  "processing", "complete", "review_alert", "returning_home",
]);

function isDisplayState(value: unknown): value is ErwinDisplayState {
  return typeof value === "string" && DISPLAY_STATES.has(value as ErwinDisplayState);
}

function parseDisplayMessage(raw: string): DisplayStateMessage | null {
  try {
    const payload = JSON.parse(raw) as Partial<DisplayStateMessage>;
    if (payload.version !== 1 || !isDisplayState(payload.state)) {
      return null;
    }
    return {
      version: 1,
      state: payload.state,
      session_id: typeof payload.session_id === "string" ? payload.session_id : null,
      pain_level: typeof payload.pain_level === "number" ? payload.pain_level : null,
      heart_rate: typeof payload.heart_rate === "number" ? payload.heart_rate : null,
    };
  } catch {
    return null;
  }
}

export interface RosbridgeConnection {
  close(): void;
}

export function connectRosbridge(
  url: string,
  topic: string,
  onState: (message: DisplayStateMessage) => void,
  onConnectionChange?: (connected: boolean) => void,
): RosbridgeConnection {
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let closed = false;

  const scheduleReconnect = () => {
    if (closed || reconnectTimer !== null) return;
    onConnectionChange?.(false);
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, 2000);
  };

  const connect = () => {
    if (closed) return;
    socket = new WebSocket(url);
    socket.addEventListener("open", () => {
      onConnectionChange?.(true);
      socket?.send(JSON.stringify({
        op: "subscribe",
        topic,
        type: "std_msgs/msg/String",
        throttle_rate: 0,
      }));
    });
    socket.addEventListener("close", scheduleReconnect);
    socket.addEventListener("error", scheduleReconnect);
    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data) as RosbridgePublishMessage;
        if (message.op !== "publish" || message.topic !== topic || typeof message.msg?.data !== "string") return;
        const state = parseDisplayMessage(message.msg.data);
        if (state) onState(state);
      } catch {
        // Ignore malformed or unrelated rosbridge frames.
      }
    });
  };

  connect();
  return {
    close: () => {
      closed = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      socket?.close();
    },
  };
}
