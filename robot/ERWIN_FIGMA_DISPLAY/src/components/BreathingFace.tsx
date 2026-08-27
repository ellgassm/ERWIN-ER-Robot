import { CSSProperties, useEffect, useRef, useState } from "react";
import { COLORS, FACE } from "@/design/tokens";
import type { BreathingPhase } from "@/types/erwin";

const { FW, FH, FCX, LEX, REX, DEY, BASE_R } = FACE;
const R = BASE_R;

// Eye paths — filled circle (inhale) ↔ happy crescent (exhale)
// Both use the same M C C Z skeleton so CSS can interpolate `d`.
function eyeOpenD(ex: number) {
  return `M ${ex-R} ${DEY} C ${ex-R} ${DEY-R*1.1} ${ex+R} ${DEY-R*1.1} ${ex+R} ${DEY} C ${ex+R} ${DEY+R*1.1} ${ex-R} ${DEY+R*1.1} ${ex-R} ${DEY} Z`;
}
function eyeClosedD(ex: number) {
  return `M ${ex-R} ${DEY} C ${ex-R} ${DEY-R*1.25} ${ex+R} ${DEY-R*1.25} ${ex+R} ${DEY} C ${ex+R} ${DEY-R*0.08} ${ex-R} ${DEY-R*0.08} ${ex-R} ${DEY} Z`;
}

// Mouth paths — wide smile crescent (inhale) ↔ small filled circle (exhale)
const LX_M = LEX + R + 2;
const RX_M = REX - R - 2;
const SMILE_D =
  `M ${LX_M} ${DEY-3} C ${LX_M} ${DEY+14} ${RX_M} ${DEY+14} ${RX_M} ${DEY-3} C ${RX_M} ${DEY-3.6} ${LX_M} ${DEY-3.6} ${LX_M} ${DEY-3} Z`;
const CIRCLE_D = (() => {
  const cx = FCX, cy = DEY + 8, cr = 7;
  return `M ${cx-cr} ${cy} C ${cx-cr} ${cy-cr*1.1} ${cx+cr} ${cy-cr*1.1} ${cx+cr} ${cy} C ${cx+cr} ${cy+cr*1.1} ${cx-cr} ${cy+cr*1.1} ${cx-cr} ${cy} Z`;
})();

const MORPH_T: CSSProperties = { transition: "d 0.55s ease-in-out" };

interface BreathingFaceProps {
  width?: number;
  onPhaseChanged?: (phase: BreathingPhase) => void;
}

export default function BreathingFace({ width = 148, onPhaseChanged }: BreathingFaceProps) {
  const [exhale, setExhale] = useState(false);
  const phaseRef = useRef<BreathingPhase>("inhale");

  useEffect(() => {
    const id = setInterval(() => setExhale(v => !v), 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const phase: BreathingPhase = exhale ? "exhale" : "inhale";
    if (phase !== phaseRef.current) {
      phaseRef.current = phase;
      onPhaseChanged?.(phase);
    }
  }, [exhale, onPhaseChanged]);

  const height = Math.round(width * (FH / FW));

  return (
    <div className="erwin-face-breathe-sync" style={{ display: "inline-block" }}>
      <svg width={width} height={height} viewBox={`0 0 ${FW} ${FH}`}>
        <defs>
          <radialGradient id="hg-breathing" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor={COLORS.faceBg1} />
            <stop offset="100%" stopColor={COLORS.faceBg2} />
          </radialGradient>
        </defs>
        <rect x={2} y={2} width={FW-4} height={FH-4} rx={22}
          fill="url(#hg-breathing)" stroke={COLORS.faceStroke} strokeWidth="1.5" />

        {/* Left eye — morphs filled circle → happy crescent */}
        <path d={exhale ? eyeClosedD(LEX) : eyeOpenD(LEX)} fill={COLORS.dotColor} style={MORPH_T} />

        {/* Right eye */}
        <path d={exhale ? eyeClosedD(REX) : eyeOpenD(REX)} fill={COLORS.dotColor} style={MORPH_T} />

        {/* Mouth — morphs wide smile → small circle */}
        <path d={exhale ? CIRCLE_D : SMILE_D} fill={COLORS.dotColor} style={MORPH_T} />
      </svg>
    </div>
  );
}
