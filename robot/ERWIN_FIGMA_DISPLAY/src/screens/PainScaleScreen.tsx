// ERWIN HRI STATE: PAIN_SCALE
//
// ENTER TRIGGER:
//   HRI controller decides to collect pain level from the patient.
//   May occur after measurement or as a standalone step in the HRI session.
//
// EXPECTED EXIT:
//   Patient selects a pain score → onPainScoreSelected(score) fires.
//   HRI controller advances state based on the score value.
//
// ROBOT DISPLAY: Conditionally touch-interactive (when interactionMode === "robot_display").
//   Shows pain scale grid with emoji faces + finger-count gestures.
// PHONE: When interactionMode === "phone", patient enters pain score on their phone.
//   Robot display could show "Please rate your pain on your phone." in this mode.
//   (See integration note below.)
//
// INTEGRATION NOTE:
//   The final ERWIN system may use the patient's phone for pain input.
//   interactionMode lets the HRI controller decide which device collects input.
//   When interactionMode === "phone", this component still renders but touch handlers
//   are not wired (future: show a waiting message overlay instead).
//   onPainScoreSelected emits the score only — no routing logic lives here.

import { PainFace, HandSign, PAIN_COLORS } from "@/components/ErwinFace";
import ErwinFace from "@/components/ErwinFace";
import { ScreenBase, ErwinWordmark } from "@/components/ScreenBase";
import type { PainScaleScreenProps } from "@/types/erwin";

export default function PainScaleScreen({
  onPainScoreSelected,
  interactionMode = "robot_display",
}: PainScaleScreenProps) {
  const isInteractive = interactionMode === "robot_display";

  return (
    <ScreenBase>
      <ErwinWordmark />

      {/* Header bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        display: "flex", alignItems: "center", gap: "24px",
        padding: "14px 24px 12px",
        borderBottom: "1px solid rgba(10,140,136,0.12)",
      }}>
        <ErwinFace expression="pain" width={110} />
        <div style={{ fontSize: "22px", color: "#0c2840", lineHeight: 1.35, maxWidth: "560px" }}>
          {isInteractive
            ? "Hold up the number of fingers, or tap your pain level below."
            : "Please rate your pain level on your phone."}
        </div>
      </div>

      {/* Pain scale grid — 5×2, levels 1–10 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gridTemplateRows: "repeat(2, 1fr)",
        height: "295px",
        padding: "10px 12px 12px",
        gap: "6px",
      }}>
        {[1,2,3,4,5,6,7,8,9,10].map(lv => (
          <button
            key={lv}
            disabled={!isInteractive}
            onClick={() => isInteractive && onPainScoreSelected(lv)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              background: "rgba(10,140,136,0.04)",
              border: "1px solid rgba(10,140,136,0.1)",
              borderRadius: "12px",
              padding: "6px 4px",
              cursor: isInteractive ? "pointer" : "default",
              opacity: isInteractive ? 1 : 0.6,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", gap: "6px" }}>
              <PainFace level={lv} size={68} />
              <div style={{ paddingBottom: "4px" }}>
                <HandSign count={lv} size={34} />
              </div>
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "16px",
              color: PAIN_COLORS[lv - 1],
              fontWeight: 500,
            }}>
              {lv}
            </div>
          </button>
        ))}
      </div>
    </ScreenBase>
  );
}
