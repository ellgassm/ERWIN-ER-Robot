// ERWIN HRI STATE: COMPLETE
//
// ENTER TRIGGER:
//   HRI session has concluded successfully. All required measurements/interactions done.
//   May be reached directly after MEASURING_HEART_RATE (normal result) or after REVIEW_ALERT.
//
// EXPECTED EXIT:
//   Short dwell → HRI controller transitions to RETURNING_HOME.
//
// ROBOT DISPLAY: Informational. Celebrates completion of the HRI session.
//   No touch input expected.
// PHONE: Patient may receive session summary or confirmation notification.
//
// INTEGRATION NOTE:
//   No dynamic data in the current design.
//   Future: could accept a sessionSummary prop for displaying measured values.

import ErwinFace from "@/components/ErwinFace";
import { ScreenBase, ErwinWordmark, StateLabel, MainText } from "@/components/ScreenBase";
import type { CompleteScreenProps } from "@/types/erwin";

export default function CompleteScreen(_props: CompleteScreenProps) {
  return (
    <ScreenBase>
      <ErwinWordmark />
      <StateLabel label="COMPLETE" />

      {/* float animation: positive emotional state */}
      <ErwinFace expression="complete" width={248} />

      <div style={{ margin: "16px 0", animation: "erwin-complete-pop 3s ease-in-out infinite" }}>
        <svg width="44" height="44" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="20" stroke="#0a8c88" strokeWidth="2" fill="none" opacity="0.4" />
          <polyline points="12,22 19,30 33,14" stroke="#0a8c88" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>

      <MainText size={26} style={{ maxWidth: "560px" }}>
        Thank you for waiting patiently.<br />You're all set.
      </MainText>
    </ScreenBase>
  );
}
