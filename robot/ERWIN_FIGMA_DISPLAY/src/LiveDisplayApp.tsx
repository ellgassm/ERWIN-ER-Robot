import { useEffect, useState } from "react";
import RobotDisplay from "@/RobotDisplay";
import { connectRosbridge } from "@/transport/rosbridge";
import type { DisplayStateMessage } from "@/types/erwin";

const ROSBRIDGE_URL = import.meta.env.VITE_ROSBRIDGE_URL || "ws://localhost:9090";
const DISPLAY_TOPIC = import.meta.env.VITE_ERWIN_DISPLAY_TOPIC || "/erwin/display_state";

export default function LiveDisplayApp() {
  const [message, setMessage] = useState<DisplayStateMessage>({ version: 1, state: "idle" });

  useEffect(() => {
    const connection = connectRosbridge(ROSBRIDGE_URL, DISPLAY_TOPIC, setMessage);
    return () => connection.close();
  }, []);

  return (
    <RobotDisplay
      state={message.state}
      painLevel={message.pain_level}
      heartRate={message.heart_rate}
      interactionMode="robot_display"
    />
  );
}
