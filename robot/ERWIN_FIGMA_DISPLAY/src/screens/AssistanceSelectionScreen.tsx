// ERWIN HRI STATE: CHOOSING_ASSISTANCE
//
// ENTER TRIGGER:
//   Greeting is complete and the HRI session is ready for patient input.
//
// EXPECTED EXIT:
//   Patient selects "Check my vitals" → onAssistanceSelected("vitals") fires.
//   Patient selects "Breathing exercise" → onAssistanceSelected("breathing") fires.
//   HRI controller then transitions to SENSOR_SETUP or BREATHING_EXERCISE.
//
// ROBOT DISPLAY: TOUCH-INTERACTIVE. Patient taps one of two options.
// PHONE: Should show "Waiting for your selection on ERWIN…" or be idle.
//
// INTEGRATION NOTE:
//   onAssistanceSelected emits the semantic event only — do NOT implement
//   state transitions or backend calls inside this component.
//   The HRI controller listens for this event and advances the state machine.

import ErwinFace from "@/components/ErwinFace";
import { ScreenBase, ErwinWordmark, StateLabel } from "@/components/ScreenBase";
import type { AssistanceSelectionScreenProps } from "@/types/erwin";

function VitalsIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="24" stroke="#0a8c88" strokeWidth="2" opacity="0.25" />
      <polyline points="6,26 14,26 18,14 22,38 26,20 30,30 34,26 46,26"
        stroke="#0a8c88" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function BreathingIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="24" stroke="#cc7a0a" strokeWidth="2" opacity="0.25" />
      <circle cx="26" cy="26" r="16" stroke="#cc7a0a" strokeWidth="1.5" opacity="0.35" />
      <circle cx="26" cy="26" r="10" stroke="#cc7a0a" strokeWidth="2" opacity="0.7" />
      <circle cx="26" cy="26" r="6" fill="#cc7a0a" opacity="0.5" />
    </svg>
  );
}

const OPTIONS = [
  {
    id: "vitals" as const,
    icon: <VitalsIcon />,
    label: "Check my vitals",
    desc: "Heart rate & health check",
    color: "#0a8c88",
  },
  {
    id: "breathing" as const,
    icon: <BreathingIcon />,
    label: "Breathing exercise",
    desc: "Guided calm technique",
    color: "#cc7a0a",
  },
];

export default function AssistanceSelectionScreen({ onAssistanceSelected }: AssistanceSelectionScreenProps) {
  return (
    <ScreenBase>
      <ErwinWordmark />
      <StateLabel label="CHOOSING" />

      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", padding: "60px 40px 40px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "240px", flexShrink: 0 }}>
          <ErwinFace expression="choosing" width={170} />
          <div style={{ marginTop: "16px", fontSize: "22px", color: "#5a8499", textAlign: "center" }}>
            How can I<br />help you?
          </div>
        </div>

        <div style={{ width: "1.5px", height: "260px", background: "rgba(10,140,136,0.15)", margin: "0 32px", flexShrink: 0 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "24px", flex: 1 }}>
          {OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => onAssistanceSelected(opt.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                background: "rgba(10,140,136,0.05)",
                border: "1.5px solid rgba(10,140,136,0.14)",
                borderRadius: "20px",
                padding: "24px 28px",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                fontFamily: "'Outfit', sans-serif",
                transition: "background 0.15s, border-color 0.15s",
              }}
              // Touch target: meets WCAG minimum for large-display touch inputs
            >
              {opt.icon}
              <div>
                <div style={{ fontSize: "28px", color: opt.color, fontWeight: 500 }}>{opt.label}</div>
                <div style={{ fontSize: "18px", color: "#5a8499", marginTop: "4px" }}>{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </ScreenBase>
  );
}
