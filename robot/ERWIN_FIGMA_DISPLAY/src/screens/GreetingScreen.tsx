// ERWIN HRI STATE: GREETING
//
// ENTER TRIGGER:
//   Robot has arrived and the HRI session has officially started.
//   Optional: patient has been identified by the HRI controller.
//
// EXPECTED EXIT:
//   Short dwell OR explicit acknowledgement from HRI controller → CHOOSING_ASSISTANCE.
//
// ROBOT DISPLAY: Informational. Displays greeting, optionally personalised.
// PHONE: N/A or patient sees session-started confirmation.
//
// INTEGRATION NOTE:
//   If patientName is provided (from Supabase patient record or session data),
//   a personalised greeting is shown. Otherwise a generic greeting is used.
//   Do not connect directly to Supabase from this component.

import ErwinFace from "@/components/ErwinFace";
import { ScreenBase, ErwinWordmark, StateLabel, MainText } from "@/components/ScreenBase";
import type { GreetingScreenProps } from "@/types/erwin";

export default function GreetingScreen({ patientName }: GreetingScreenProps) {
  const greeting = patientName ? `Hello, ${patientName}!` : "Hello! I'm ERWIN.";

  return (
    <ScreenBase>
      <ErwinWordmark />
      <StateLabel label="GREETING" />

      {/* Warm amber radial glow — communicates positive/welcoming state */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(245,160,32,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* float animation: positive emotional state */}
      <ErwinFace expression="greeting" width={260} />
      <div style={{ height: "22px" }} />
      <MainText size={34}>{greeting}</MainText>
      <div style={{ height: "10px" }} />
      <MainText size={24} color="#5a8499">I'm here to help.</MainText>
    </ScreenBase>
  );
}
