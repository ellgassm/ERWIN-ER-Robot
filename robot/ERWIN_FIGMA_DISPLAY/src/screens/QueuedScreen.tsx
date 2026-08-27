// ERWIN HRI STATE: QUEUED
//
// ENTER TRIGGER:
//   Robot has been assigned to a patient but navigation has not yet started,
//   OR navigation is in early dispatch phase.
//
// EXPECTED EXIT:
//   Navigation begins → transition to NAVIGATING.
//
// ROBOT DISPLAY: Informational. Shows queue position / wait time if available.
// PHONE: N/A or patient may see session-starting notification.
//
// INTEGRATION NOTE:
//   queuePosition and estimatedWait come from the task-assignment system.
//   Render "--" / "calculating..." if not yet available.

import ErwinFace from "@/components/ErwinFace";
import { ScreenBase, ErwinWordmark, StateLabel, MainText } from "@/components/ScreenBase";
import type { QueuedScreenProps } from "@/types/erwin";

export default function QueuedScreen({ queuePosition, estimatedWait }: QueuedScreenProps) {
  return (
    <ScreenBase>
      <ErwinWordmark />
      <StateLabel label="QUEUED" />

      <ErwinFace expression="queued" width={252} />
      <div style={{ height: "24px" }} />
      <MainText size={30}>Navigating! I'll be with you soon.</MainText>

      {(queuePosition != null || estimatedWait != null) && (
        <div style={{ marginTop: "16px", display: "flex", gap: "24px" }}>
          {queuePosition != null && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#94b8c8", letterSpacing: "0.1em", marginBottom: "4px" }}>POSITION</div>
              <div style={{ fontSize: "28px", color: "#0a8c88", fontWeight: 600 }}>{queuePosition}</div>
            </div>
          )}
          {estimatedWait != null && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#94b8c8", letterSpacing: "0.1em", marginBottom: "4px" }}>EST. WAIT</div>
              <div style={{ fontSize: "28px", color: "#0a8c88", fontWeight: 600 }}>{estimatedWait}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: "28px", display: "flex", gap: "12px" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: "10px", height: "10px",
            borderRadius: "50%", background: "#0a8c88",
            animation: `erwin-dot-bounce 1.4s ease-in-out ${i * 0.22}s infinite`,
          }} />
        ))}
      </div>
    </ScreenBase>
  );
}
