// ERWIN HRI STATE: RETURNING_HOME
//
// ENTER TRIGGER:
//   HRI session is complete (COMPLETE or REVIEW_ALERT resolved).
//   HRI controller issues a Nav2 navigation goal back to the base station.
//
// EXPECTED EXIT:
//   Robot docks at base station → transition to IDLE.
//
// ROBOT DISPLAY: Informational. nav-bob communicates robot movement.
//   No touch interaction expected.
// PHONE: Patient's session is over. Phone app shows session-ended confirmation.
//
// INTEGRATION NOTE:
//   No dynamic data. Nav2 goal/status is managed by the HRI controller.

import ErwinFace from "@/components/ErwinFace";
import { ScreenBase, ErwinWordmark, StateLabel, MainText } from "@/components/ScreenBase";
import type { ReturningHomeScreenProps } from "@/types/erwin";

export default function ReturningHomeScreen(_props: ReturningHomeScreenProps) {
  return (
    <ScreenBase>
      <ErwinWordmark />
      <StateLabel label="RETURNING" />

      {/* nav-bob animation: communicates robot movement */}
      <ErwinFace expression="returning" width={252} />
      <div style={{ height: "24px" }} />
      <MainText color="#5a8499">I'm returning to my station.</MainText>

      <div style={{ marginTop: "24px", display: "flex", gap: "6px", opacity: 0.5 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: "8px", height: "8px",
            borderRadius: "50%", background: "#0a8c88",
            animation: `erwin-nav-dot 1.6s ease-in-out ${(2 - i) * 0.28}s infinite`,
          }} />
        ))}
        <svg width="20" height="20" viewBox="0 0 20 20" style={{ marginLeft: "4px", opacity: 0.7 }}>
          <polygon points="4,3 16,10 4,17" fill="#0a8c88" />
        </svg>
      </div>
    </ScreenBase>
  );
}
