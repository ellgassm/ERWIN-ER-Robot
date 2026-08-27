// ERWIN HRI STATE: MEASURING_HEART_RATE
//
// ENTER TRIGGER:
//   Sensor is confirmed attached. PPG sensor bridge begins data acquisition.
//
// EXPECTED EXIT:
//   Measurement complete and within normal range → transition to COMPLETE.
//   Measurement flagged (high/low BPM) → transition to REVIEW_ALERT.
//   HRI controller makes this determination externally; no logic here.
//
// HARDWARE: PPG finger sensor actively streaming data.
//
// ROBOT DISPLAY: Informational. Shows live BPM + ECG waveform.
//   No touch interaction expected.
// PHONE: Should show "Measurement in progress…" loading state.
//
// INTEGRATION NOTE:
//   heartRate: live BPM from ROS2 sensor topic / sensor bridge. null = acquiring.
//   measurementStatus: controls display copy ("Acquiring signal…", "Measuring…", etc.)
//   signalQuality and elapsedTime are reserved for future UI enhancements.
//   Do NOT read sensor data directly from ROS2 or Supabase inside this component.

import ErwinFace from "@/components/ErwinFace";
import { ScreenBase, ErwinWordmark, StateLabel, MainText } from "@/components/ScreenBase";
import type { MeasuringHeartRateScreenProps } from "@/types/erwin";

// Scrolling ECG-style waveform — purely decorative/atmospheric
function HeartRateWave() {
  const seg = "M0,50 L30,50 L45,20 L55,80 L65,10 L75,60 L85,45 L100,50 L130,50 L145,20 L155,80 L165,10 L175,60 L185,45 L200,50 L230,50 L245,20 L255,80 L265,10 L275,60 L285,45 L300,50";
  return (
    <svg width="340" height="100" viewBox="0 0 300 100" style={{ overflow: "hidden" }}>
      <defs>
        <linearGradient id="wavegrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(10,140,136,0)" />
          <stop offset="30%"  stopColor="rgba(10,140,136,0.85)" />
          <stop offset="70%"  stopColor="rgba(10,140,136,0.85)" />
          <stop offset="100%" stopColor="rgba(10,140,136,0)" />
        </linearGradient>
      </defs>
      <g style={{ animation: "erwin-hr-wave 2s linear infinite" }}>
        <path d={seg} stroke="url(#wavegrad)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d={seg.replace(/M0,/g, "M300,").replace(/L(\d+),/g, (_, n) => `L${+n + 300},`)}
          stroke="url(#wavegrad)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

const STATUS_COPY: Record<string, string> = {
  waiting:   "Waiting for sensor…",
  acquiring: "Acquiring signal…",
  measuring: "Let's check your heart rate.",
  complete:  "Measurement complete.",
  error:     "Signal lost. Please hold still.",
};

export default function MeasuringHeartRateScreen({
  heartRate,
  measurementStatus = "measuring",
}: MeasuringHeartRateScreenProps) {
  const bpmDisplay = heartRate != null ? String(heartRate) : "--";
  const copy = STATUS_COPY[measurementStatus] ?? STATUS_COPY.measuring;

  return (
    <ScreenBase>
      <ErwinWordmark />
      <StateLabel label="MEASURING" />

      <div style={{ display: "flex", alignItems: "center", gap: "40px", zIndex: 1, padding: "0 50px" }}>
        {/* heartbeat animation on face — communicates active measurement */}
        <ErwinFace expression="measuring" width={252} />

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            {/* BPM display — "--" until live data is provided via heartRate prop */}
            <span style={{ fontSize: "72px", color: "#0a8c88", fontWeight: 600, lineHeight: 1 }}>{bpmDisplay}</span>
            <span style={{ fontSize: "20px", color: "#5a8499", fontFamily: "'DM Mono', monospace" }}>BPM</span>
          </div>
          <div style={{ overflow: "hidden", borderRadius: "8px" }}>
            <HeartRateWave />
          </div>
        </div>
      </div>

      <div style={{ height: "22px" }} />
      <MainText size={28}>{copy}</MainText>
    </ScreenBase>
  );
}
