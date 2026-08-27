import { COLORS, FACE, FONTS } from "@/design/tokens";
import type { ErwinExpression } from "@/types/erwin";

const { FW, FH, FCX, LEX, REX, DEY, BASE_R } = FACE;

type ExprData = {
  dotR: number;
  barType: "happy" | "content" | "straight";
  faceClass: string;
  dotClass: string;
  cheeks: boolean;
};

const EXPR: Record<ErwinExpression, ExprData> = {
  idle:       { dotR:1,    barType:"happy",    faceClass:"erwin-face-breathe",   dotClass:"erwin-blink-slow", cheeks:false },
  queued:     { dotR:1.18, barType:"happy",    faceClass:"",                     dotClass:"erwin-blink-med",  cheeks:false },
  navigating: { dotR:1.1,  barType:"straight", faceClass:"erwin-face-nav",       dotClass:"erwin-blink-med",  cheeks:false },
  arriving:   { dotR:1.25, barType:"happy",    faceClass:"",                     dotClass:"erwin-blink-fast", cheeks:false },
  greeting:   { dotR:0.7,  barType:"happy",    faceClass:"erwin-face-float",     dotClass:"erwin-blink-slow", cheeks:true  },
  choosing:   { dotR:1,    barType:"happy",    faceClass:"",                     dotClass:"erwin-blink-med",  cheeks:false },
  measuring:  { dotR:0.92, barType:"happy",    faceClass:"erwin-face-heartbeat", dotClass:"erwin-blink-slow", cheeks:false },
  pain:       { dotR:1,    barType:"happy",    faceClass:"",                     dotClass:"erwin-blink-slow", cheeks:false },
  processing: { dotR:1,    barType:"straight", faceClass:"erwin-face-breathe",   dotClass:"",                 cheeks:false },
  complete:   { dotR:0.68, barType:"happy",    faceClass:"erwin-face-float",     dotClass:"erwin-blink-slow", cheeks:true  },
  alert:      { dotR:1.06, barType:"happy",    faceClass:"",                     dotClass:"erwin-blink-med",  cheeks:false },
  returning:  { dotR:0.95, barType:"happy",    faceClass:"",                     dotClass:"erwin-blink-slow", cheeks:false },
};

function getBarD(type: ExprData["barType"], r: number): string {
  const lx = LEX + r + 2;
  const rx = REX - r - 2;
  switch (type) {
    case "happy":    return `M ${lx} ${DEY - 3} Q ${FCX} ${DEY + 10} ${rx} ${DEY - 3}`;
    case "content":  return `M ${lx} ${DEY - 1} Q ${FCX} ${DEY + 5}  ${rx} ${DEY - 1}`;
    case "straight": return `M ${lx} ${DEY}     L ${rx} ${DEY}`;
  }
}

interface ErwinFaceProps {
  expression: ErwinExpression;
  /** Render width in px. Height is derived from the 110:68 aspect ratio. */
  width?: number;
  /**
   * When true, wraps the face in the breathing-sync animation class instead of
   * the expression's default animation class. Use for the BreathingExercise screen.
   */
  breathing?: boolean;
}

export default function ErwinFace({ expression, width = 220, breathing = false }: ErwinFaceProps) {
  const height = Math.round(width * (FH / FW));
  const ed = EXPR[expression];
  const r = BASE_R * ed.dotR;

  return (
    <div
      className={breathing ? "erwin-face-breathe-sync" : ed.faceClass}
      style={{ display: "inline-block" }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${FW} ${FH}`}>
        <defs>
          <radialGradient id={`hg-${expression}`} cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor={COLORS.faceBg1} />
            <stop offset="100%" stopColor={COLORS.faceBg2} />
          </radialGradient>
        </defs>

        <rect x={2} y={2} width={FW - 4} height={FH - 4} rx={22}
          fill={`url(#hg-${expression})`} stroke={COLORS.faceStroke} strokeWidth="1.5" />

        {ed.cheeks && (
          <>
            <ellipse cx={LEX - r - 5} cy={DEY + 8} rx={7} ry={4} fill={COLORS.amberLight} opacity={0.2} />
            <ellipse cx={REX + r + 5} cy={DEY + 8} rx={7} ry={4} fill={COLORS.amberLight} opacity={0.2} />
          </>
        )}

        <g className={`erwin-eye ${ed.dotClass}`}>
          <circle cx={LEX} cy={DEY} r={r} fill={COLORS.dotColor} />
        </g>

        <path d={getBarD(ed.barType, r)}
          stroke={COLORS.dotColor} strokeWidth={3.5} strokeLinecap="round" fill="none" />

        <g className={`erwin-eye ${ed.dotClass}`}>
          <circle cx={REX} cy={DEY} r={r} fill={COLORS.dotColor} />
        </g>

        {expression === "processing" && (
          <g style={{
            transformOrigin: `${FCX}px ${DEY}px`,
            animation: "erwin-rotate 3s linear infinite",
          }}>
            <circle cx={FCX + 36} cy={DEY}      r={2.8} fill="rgba(10,140,136,0.45)" />
            <circle cx={FCX - 36} cy={DEY}      r={2.8} fill="rgba(10,140,136,0.45)" />
            <circle cx={FCX}      cy={DEY - 36} r={2}   fill="rgba(10,140,136,0.3)" />
            <circle cx={FCX}      cy={DEY + 36} r={2}   fill="rgba(10,140,136,0.3)" />
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Pain Scale Face ──────────────────────────────────────────────────────────

export const PAIN_COLORS = [
  "#6ed46a","#96de58","#bae044","#dce030",
  "#f2c820","#f5a820","#f07020","#e84820","#d82828","#b81818",
];

interface PainFaceProps {
  level: number;
  size?: number;
}

export function PainFace({ level, size = 80 }: PainFaceProps) {
  const r = size / 2 - 2;
  const cx = size / 2, cy = size / 2;
  const color = PAIN_COLORS[Math.min(level - 1, 9)];
  const eyeY = cy - r * 0.14;
  const lEx = cx - r * 0.33, rEx = cx + r * 0.33;
  const eR = r * 0.1;
  const mY = cy + r * 0.26;
  const mS = r * 0.38;
  const sw = r * 0.07;

  const getMouth = () => {
    if (level <= 2) return `M ${cx-mS} ${mY-r*0.06} Q ${cx} ${mY+r*0.22} ${cx+mS} ${mY-r*0.06}`;
    if (level <= 4) return `M ${cx-mS*0.75} ${mY} Q ${cx} ${mY+r*0.12} ${cx+mS*0.75} ${mY}`;
    if (level === 5) return `M ${cx-mS*0.65} ${mY+r*0.02} L ${cx+mS*0.65} ${mY+r*0.02}`;
    if (level <= 7) return `M ${cx-mS*0.75} ${mY} Q ${cx} ${mY-r*0.12} ${cx+mS*0.75} ${mY}`;
    if (level <= 9) return `M ${cx-mS} ${mY+r*0.04} Q ${cx} ${mY-r*0.2} ${cx+mS} ${mY+r*0.04}`;
    return `M ${cx-mS} ${mY+r*0.08} Q ${cx} ${mY-r*0.28} ${cx+mS} ${mY+r*0.08}`;
  };

  const eyeRY = level <= 4 ? eR : level <= 6 ? eR * 0.7 : eR * 0.45;
  const browAngle = level >= 6 ? (level - 5) * 2.5 : 0;
  const browY = eyeY - eR * 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill={color} stroke="#1a1a1a" strokeWidth="3.5" />
      <ellipse cx={cx} cy={cy - r * 0.5} rx={r * 0.45} ry={r * 0.2} fill="rgba(255,255,255,0.12)" />
      {level >= 6 && (
        <>
          <line x1={lEx-eR*1.3} y1={browY+browAngle*0.5} x2={lEx+eR*1.3} y2={browY-browAngle*0.3}
            stroke="#1a1a1a" strokeWidth={sw * 1.1} strokeLinecap="round" />
          <line x1={rEx-eR*1.3} y1={browY-browAngle*0.3} x2={rEx+eR*1.3} y2={browY+browAngle*0.5}
            stroke="#1a1a1a" strokeWidth={sw * 1.1} strokeLinecap="round" />
        </>
      )}
      {level <= 8 ? (
        <>
          <ellipse cx={lEx} cy={eyeY} rx={eR * 1.05} ry={eyeRY} fill="#1a1a1a" />
          <ellipse cx={rEx} cy={eyeY} rx={eR * 1.05} ry={eyeRY} fill="#1a1a1a" />
          {level >= 6 && (
            <>
              <line x1={lEx-eR*1.1} y1={eyeY-eyeRY*0.5} x2={lEx+eR*1.1} y2={eyeY-eyeRY*0.5} stroke="#1a1a1a" strokeWidth={sw * 0.8} />
              <line x1={rEx-eR*1.1} y1={eyeY-eyeRY*0.5} x2={rEx+eR*1.1} y2={eyeY-eyeRY*0.5} stroke="#1a1a1a" strokeWidth={sw * 0.8} />
            </>
          )}
        </>
      ) : (
        [lEx, rEx].map((ex, i) => (
          <g key={i}>
            <line x1={ex-eR} y1={eyeY-eR} x2={ex+eR} y2={eyeY+eR} stroke="#1a1a1a" strokeWidth={sw*1.2} strokeLinecap="round" />
            <line x1={ex+eR} y1={eyeY-eR} x2={ex-eR} y2={eyeY+eR} stroke="#1a1a1a" strokeWidth={sw*1.2} strokeLinecap="round" />
          </g>
        ))
      )}
      {level >= 7 && (
        <ellipse cx={lEx - eR * 2.2} cy={mY - r * 0.12} rx={eR * 0.55} ry={eR * 0.85} fill="#60a8e0" opacity={0.75} />
      )}
      <path d={getMouth()} stroke="#1a1a1a" strokeWidth={sw * 1.4} strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Hand Sign (finger-count gesture visual) ──────────────────────────────────

export function HandSign({ count, size = 42 }: { count: number; size?: number }) {
  if (count > 5) return (
    <div style={{ display: "flex", gap: "3px", alignItems: "flex-end" }}>
      <HandSignSingle count={5} size={size * 0.82} />
      <HandSignSingle count={count - 5} size={size * 0.82} />
    </div>
  );
  return <HandSignSingle count={count} size={size} />;
}

function HandSignSingle({ count, size = 42 }: { count: number; size?: number }) {
  const w = size, h = size * 1.25;
  const palmH = h * 0.37, palmW = w * 0.76;
  const palmX = (w - palmW) / 2, palmY = h - palmH - 1;
  const fw = palmW / 5.8;
  const fgap = (palmW - fw * 5) / 4;
  const maxFH = palmY - 3;
  const fHeights = [0.68, 0.86, 1.0, 0.88, 0.66];
  const upMap: Record<number, number[]> = {
    0: [], 1: [1], 2: [1, 2], 3: [1, 2, 3], 4: [1, 2, 3, 4], 5: [0, 1, 2, 3, 4],
  };
  const up = new Set(upMap[Math.min(count, 5)]);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {[0, 1, 2, 3, 4].map(i => {
        const isUp = up.has(i);
        const fh = isUp ? maxFH * fHeights[i] : maxFH * 0.18;
        const fx = palmX + i * (fw + fgap);
        const fy = isUp ? palmY - fh + 3 : palmY - fh * 0.15;
        return (
          <rect key={i} x={fx} y={fy} width={fw}
            height={isUp ? fh : fh * 0.15 + palmH * 0.1}
            rx={fw / 2} fill={COLORS.faceStroke} stroke="#4a7a90" strokeWidth="2" />
        );
      })}
      <rect x={palmX} y={palmY} width={palmW} height={palmH}
        rx={palmH * 0.32} fill={COLORS.faceStroke} stroke="#4a7a90" strokeWidth="2.5" />
    </svg>
  );
}

// Re-export expression type for convenience
export type { ErwinExpression };
export { FONTS };
