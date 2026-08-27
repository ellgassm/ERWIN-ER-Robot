// ERWIN HRI STATE: IDLE
//
// ENTER TRIGGER:
//   Robot is docked at base station and not assigned to any patient.
//   System is active and healthy (charging or standby).
//
// EXPECTED EXIT:
//   HRI controller assigns the robot to a patient → transition to QUEUED.
//
// ROBOT DISPLAY: Informational only. No touch interaction.
// PHONE: N/A (no active session).
//
// INTEGRATION NOTE:
//   This screen loops indefinitely until an external assignment event.
//   No user input is expected or handled here.

import ErwinFace from "@/components/ErwinFace";
import { ScreenBase, ErwinWordmark, StateLabel, MainText } from "@/components/ScreenBase";
import type { IdleScreenProps } from "@/types/erwin";

export default function IdleScreen(_props: IdleScreenProps) {
  return (
    <ScreenBase>
      <ErwinWordmark />
      <StateLabel label="IDLE" />

      {/* Ambient pulse rings — communicates standby/ready state */}
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          position: "absolute",
          width: "240px", height: "180px",
          borderRadius: "50%",
          border: "1.5px solid rgba(10,140,136,0.2)",
          animation: `erwin-pulse-ring 4.5s ease-out ${i * 1.5}s infinite`,
          pointerEvents: "none",
        }} />
      ))}

      <ErwinFace expression="idle" width={260} />
      <div style={{ height: "28px" }} />
      <MainText color="#5a8499">Waiting to assist you</MainText>

      <div style={{ position: "absolute", bottom: 22, display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0a8c88", animation: "erwin-breathe 2s ease-in-out infinite" }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "14px", color: "#94b8c8" }}>charging</span>
      </div>
    </ScreenBase>
  );
}
