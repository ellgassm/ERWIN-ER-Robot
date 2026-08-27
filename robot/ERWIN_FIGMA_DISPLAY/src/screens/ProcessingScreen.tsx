// ERWIN HRI STATE: PROCESSING
//
// ENTER TRIGGER:
//   Robot is waiting for a backend computation, ROS2 service call, or
//   Supabase query to complete. Typically shown briefly between measurement
//   and review/complete states.
//
// NOTE: This screen is for the ROBOT DISPLAY.
//   A visually similar loading state on the PATIENT'S PHONE is a separate component
//   in the patient web application and is NOT part of this package.
//
// EXPECTED EXIT:
//   Backend/HRI controller resolves → transition to COMPLETE or REVIEW_ALERT.
//   Timeout → HRI controller handles error recovery.
//
// ROBOT DISPLAY: Informational. Orbit animation communicates active thinking.
//   No touch input expected.
// PHONE: Should show its own processing/loading indicator.
//
// INTEGRATION NOTE:
//   No dynamic data. Duration is controlled externally by the HRI controller.

import ErwinFace from "@/components/ErwinFace";
import { ScreenBase, ErwinWordmark, StateLabel, MainText } from "@/components/ScreenBase";
import type { ProcessingScreenProps } from "@/types/erwin";

export default function ProcessingScreen(_props: ProcessingScreenProps) {
  return (
    <ScreenBase>
      <ErwinWordmark />
      <StateLabel label="PROCESSING" />

      {/* orbit animation on face: communicates robot is thinking */}
      <ErwinFace expression="processing" width={260} />
      <div style={{ height: "28px" }} />
      <MainText color="#5a8499">One moment...</MainText>

      <div style={{ marginTop: "24px", display: "flex", gap: "14px" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: "10px", height: "10px",
            borderRadius: "50%", background: "#0a8c88",
            animation: `erwin-think-dot 1.6s ease-in-out ${i * 0.28}s infinite`,
          }} />
        ))}
      </div>
    </ScreenBase>
  );
}
