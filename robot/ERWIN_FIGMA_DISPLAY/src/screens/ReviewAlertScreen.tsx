// ERWIN HRI STATE: REVIEW_ALERT
//
// ENTER TRIGGER:
//   Measurement result (e.g. heart rate) exceeds normal thresholds.
//   HRI controller flags the reading and routes here instead of COMPLETE.
//
// EXPECTED EXIT:
//   Care team notification has been dispatched → transition to COMPLETE.
//   HRI controller advances state after notifying the care team system.
//
// ROBOT DISPLAY: Informational. Communicates that a care team member is being notified.
//   No touch input expected from patient.
// PHONE: Patient may receive an alert or see "A nurse has been notified" message.
//
// HARDWARE: None directly. The care team notification is handled by the HRI controller.
//
// INTEGRATION NOTE:
//   alertLevel: severity indicator from HRI controller.
//   heartRate: the flagged reading — pass from MeasuringHeartRateScreen measurement result.
//   notes: optional freeform note from the HRI controller or care team system.
//   The care team notification logic (Supabase, paging, etc.) lives in the HRI controller —
//   not in this component.

import ErwinFace from "@/components/ErwinFace";
import { ScreenBase, ErwinWordmark, StateLabel, MainText } from "@/components/ScreenBase";
import type { ReviewAlertScreenProps } from "@/types/erwin";

const ALERT_COPY: Record<string, string> = {
  info:    "I'd like a member of the care team to check in with you.",
  caution: "I'm going to notify a member of the care team.",
  urgent:  "Please stay calm — I'm alerting the care team right now.",
};

export default function ReviewAlertScreen({
  alertLevel = "caution",
  heartRate,
  notes,
}: ReviewAlertScreenProps) {
  const copy = notes ?? ALERT_COPY[alertLevel] ?? ALERT_COPY.caution;

  return (
    <ScreenBase>
      <ErwinWordmark />
      <StateLabel label="REVIEW" />

      <div style={{ display: "flex", alignItems: "center", gap: "48px", zIndex: 1, padding: "0 50px" }}>
        <ErwinFace expression="alert" width={252} />

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Care team indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="#cc7a0a" strokeWidth="1.5" opacity="0.5" />
              <circle cx="20" cy="15" r="6" stroke="#cc7a0a" strokeWidth="2" />
              <path d="M8,36 C8,28 32,28 32,36" stroke="#cc7a0a" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: "20px", color: "#cc7a0a", fontWeight: 400 }}>Care team</span>
          </div>

          {/* Optional: flagged heart rate reading */}
          {heartRate != null && (
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "36px", color: "#cc7a0a", fontWeight: 600, lineHeight: 1 }}>{heartRate}</span>
              <span style={{ fontSize: "16px", color: "#cc7a0a", fontFamily: "'DM Mono', monospace", opacity: 0.75 }}>BPM</span>
            </div>
          )}

          <div style={{ width: "280px", height: "1.5px", background: "rgba(204,122,10,0.2)" }} />

          <MainText size={26} style={{ textAlign: "left", maxWidth: "320px" }}>
            {copy}
          </MainText>
        </div>
      </div>
    </ScreenBase>
  );
}
