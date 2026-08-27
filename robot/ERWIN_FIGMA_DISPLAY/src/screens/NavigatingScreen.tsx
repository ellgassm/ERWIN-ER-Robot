// ERWIN HRI STATE: NAVIGATING
//
// ENTER TRIGGER:
//   Nav2 navigation stack has accepted a goal and the robot is actively moving.
//
// EXPECTED EXIT:
//   Robot reaches goal proximity → transition to ARRIVING.
//   Navigation failure → HRI controller handles recovery (not displayed here).
//
// ROBOT DISPLAY: Informational. nav-bob animation communicates movement.
// PHONE: N/A or patient may see "ERWIN is on the way".
//
// INTEGRATION NOTE:
//   No dynamic data is displayed on the robot screen in this state.
//   Future enhancement: estimated arrival distance/time could be added as props.

import ErwinFace from "@/components/ErwinFace";
import { ScreenBase, ErwinWordmark, StateLabel, MainText } from "@/components/ScreenBase";
import type { NavigatingScreenProps } from "@/types/erwin";

export default function NavigatingScreen(_props: NavigatingScreenProps) {
  return (
    <ScreenBase>
      <ErwinWordmark />
      <StateLabel label="NAVIGATING" />

      <div style={{ display: "flex", alignItems: "center", gap: "48px", zIndex: 1 }}>
        {/* nav-bob animation communicates robot movement */}
        <ErwinFace expression="navigating" width={252} />

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "center" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: "10px", height: "10px",
              borderRadius: "50%", background: "#0a8c88",
              animation: `erwin-nav-dot 1.2s ease-in-out ${i * 0.3}s infinite`,
            }} />
          ))}
          <svg width="28" height="28" viewBox="0 0 28 28" style={{ marginTop: "6px" }}>
            <polygon points="14,3 26,25 14,20 2,25" fill="#0a8c88" opacity="0.6" />
          </svg>
        </div>
      </div>

      <div style={{ height: "26px" }} />
      <MainText>I'm on my way.</MainText>
    </ScreenBase>
  );
}
