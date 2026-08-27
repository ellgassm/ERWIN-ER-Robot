// ERWIN HRI STATE: ARRIVING
//
// ENTER TRIGGER:
//   Robot has reached the assigned waiting location (Nav2 goal reached).
//   HRI outer lifecycle transitions from navigation → HRI session start.
//
// EXPECTED EXIT:
//   Short dwell (e.g. 2–3 s) → HRI controller advances to GREETING.
//   Transition can be timer-based in the HRI controller; no timer lives here.
//
// ROBOT DISPLAY: Informational. Arrival rings communicate presence.
// PHONE: N/A or patient sees session-starting notification.
//
// INTEGRATION NOTE:
//   Advance state externally via the HRI controller. Do not auto-transition here.

import ErwinFace from "@/components/ErwinFace";
import { ScreenBase, ErwinWordmark, StateLabel, MainText } from "@/components/ScreenBase";
import type { ArrivingScreenProps } from "@/types/erwin";

export default function ArrivingScreen(_props: ArrivingScreenProps) {
  return (
    <ScreenBase>
      <ErwinWordmark />
      <StateLabel label="ARRIVING" />

      {/* Arrival ring animations — communicates robot has stopped */}
      {[1, 2].map(i => (
        <div key={i} style={{
          position: "absolute",
          width: "280px", height: "210px",
          borderRadius: "50%",
          border: "2px solid rgba(10,140,136,0.3)",
          animation: `erwin-arrive-ring 2.2s ease-out ${i * 1}s infinite`,
          pointerEvents: "none",
        }} />
      ))}

      <ErwinFace expression="arriving" width={260} />
      <div style={{ height: "26px" }} />
      <MainText size={38}>I've arrived.</MainText>
    </ScreenBase>
  );
}
