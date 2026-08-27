// ERWIN HRI STATE: SENSOR_SETUP
//
// ENTER TRIGGER:
//   Patient selected "Check my vitals". HRI controller prepares the PPG sensor session.
//
// EXPECTED EXIT:
//   Sensor is attached and ready → HRI controller advances to MEASURING_HEART_RATE.
//   Timeout or patient declines → HRI controller handles; no logic here.
//
// HARDWARE: PPG finger sensor is involved. Robot must be physically close to patient.
//
// ROBOT DISPLAY: Informational/instructional. Guides patient to attach sensor.
//   No touch input required from patient on this screen.
// PHONE: Should show "Follow ERWIN's instructions…" or loading state.
//
// INTEGRATION NOTE:
//   The step-by-step instructions are static design content.
//   If real-time sensor readiness status is available (e.g. ROS2 topic),
//   future enhancement: add a readinessStatus prop to show sensor-connected indicator.

import ppgSensorImg from "@/imports/image-1.png";
import ErwinFace from "@/components/ErwinFace";
import { ScreenBase, ErwinWordmark, StateLabel, MainText } from "@/components/ScreenBase";
import type { SensorSetupScreenProps } from "@/types/erwin";

const STEPS = [
  { n: "1", text: "Wrap sensor on fingertip" },
  { n: "2", text: "Keep hand relaxed" },
  { n: "3", text: "Wait for reading" },
];

export default function SensorSetupScreen(_props: SensorSetupScreenProps) {
  return (
    <ScreenBase>
      <ErwinWordmark />
      <StateLabel label="SENSOR SETUP" />

      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", padding: "58px 36px 36px" }}>
        {/* Left: face + instructions */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "330px", flexShrink: 0, gap: "18px" }}>
          <ErwinFace expression="measuring" width={200} />
          <MainText size={26} style={{ textAlign: "center" }}>
            Wrap the sensor around the tip of your index finger.
          </MainText>
          <div style={{ fontSize: "19px", color: "#5a8499", textAlign: "center", lineHeight: 1.45 }}>
            Hold still — this takes about 15 seconds.
          </div>
        </div>

        <div style={{ width: "1.5px", height: "310px", background: "rgba(10,140,136,0.12)", margin: "0 24px", flexShrink: 0 }} />

        {/* Right: PPG sensor photo + step guide */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <img
            src={ppgSensorImg}
            alt="Index finger with PPG sensor wrapped around the fingertip"
            style={{ width: 240, height: "auto", objectFit: "contain" }}
          />
          <div style={{ display: "flex", gap: "20px" }}>
            {STEPS.map(step => (
              <div key={step.n} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "24px", height: "24px",
                  borderRadius: "50%",
                  background: "#0a8c88",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", color: "white", fontWeight: 600, flexShrink: 0,
                }}>
                  {step.n}
                </div>
                <span style={{ fontSize: "17px", color: "#4a7a90" }}>{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScreenBase>
  );
}
