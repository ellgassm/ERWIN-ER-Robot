// ERWIN HRI STATE: BREATHING_EXERCISE
//
// ENTER TRIGGER:
//   Patient selected "Breathing exercise" in the CHOOSING_ASSISTANCE state.
//
// EXPECTED EXIT:
//   HRI controller decides the session is complete (timer, cycles, or patient request).
//   onExerciseCompleted() fires when the component is ready to exit, but the HRI
//   controller must explicitly advance the state — do not auto-transition here.
//
// ROBOT DISPLAY: Informational/therapeutic. Animated orb + face morphing guide breathing.
//   No direct touch input required.
// PHONE: Should show "Breathing exercise in progress…" or be idle.
//
// HARDWARE: No sensors involved.
//
// ANIMATION:
//   8 s inhale/exhale loop:
//     - Orb: scale 0.48 → 1.0 (expand on inhale), 1.0 → 0.48 (contract on exhale)
//     - Rings: three staggered rings, each 2.66 s offset
//     - Face: morphs eyes open (inhale) → crescent (exhale); mouth smile → O
//   Extend to multi-minute session by looping in the HRI controller (no timer here).
//
// INTEGRATION NOTE:
//   onExerciseStarted fires once on mount.
//   onExercisePhaseChanged fires every 4 s as phase alternates inhale/exhale.
//   These are optional hooks for HRI controller logging/monitoring.

import { useEffect } from "react";
import BreathingFace from "@/components/BreathingFace";
import { ScreenBase, ErwinWordmark, StateLabel } from "@/components/ScreenBase";
import type { BreathingExerciseScreenProps } from "@/types/erwin";

export default function BreathingExerciseScreen({
  onExerciseStarted,
  onExercisePhaseChanged,
  onExerciseCompleted: _onExerciseCompleted,
}: BreathingExerciseScreenProps) {
  useEffect(() => {
    onExerciseStarted?.();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ScreenBase>
      <ErwinWordmark />
      <StateLabel label="BREATHING" />

      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        paddingTop: "36px",
        paddingBottom: "28px",
      }}>
        {/* Face morphs between inhale (open eyes + smile) and exhale (crescent + O-mouth) */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <BreathingFace width={148} onPhaseChanged={onExercisePhaseChanged} />
        </div>

        {/* Orb + rings — 8 s breathing cycle */}
        <div style={{
          position: "relative",
          width: "260px", height: "260px",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginTop: "10px", flexShrink: 0,
        }}>
          {/* Staggered rings */}
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: "absolute", inset: 0,
              borderRadius: "50%",
              border: "1.5px solid rgba(10,140,136,0.22)",
              animation: `erwin-breathe-ring-out 8s ease-in-out ${i * 2.66}s infinite`,
            }} />
          ))}
          {/* Main orb — expands on inhale, contracts on exhale */}
          <div style={{
            width: "200px", height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(10,140,136,0.22) 0%, rgba(10,140,136,0.07) 62%, transparent 82%)",
            border: "2px solid rgba(10,140,136,0.4)",
            boxShadow: "0 0 40px rgba(10,140,136,0.12)",
            animation: "erwin-breathe-orb 8s ease-in-out infinite",
            flexShrink: 0,
          }} />
        </div>

        {/* Inhale / Exhale text crossfade */}
        <div style={{ position: "relative", height: "46px", width: "200px", marginTop: "2px" }}>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "26px", color: "#0a8c88",
            letterSpacing: "0.38em", textTransform: "uppercase", fontWeight: 300,
            animation: "erwin-inhale-text 8s ease-in-out infinite",
          }}>
            inhale
          </div>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "26px", color: "#0a8c88",
            letterSpacing: "0.38em", textTransform: "uppercase", fontWeight: 300,
            animation: "erwin-exhale-text 8s ease-in-out infinite",
          }}>
            exhale
          </div>
        </div>

        <div style={{ fontSize: "15px", color: "#94b8c8", letterSpacing: "0.06em", marginTop: "8px" }}>
          breathe gently at your own pace
        </div>
      </div>
    </ScreenBase>
  );
}
