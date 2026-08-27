import { CSSProperties, ReactNode } from "react";
import { COLORS, FONTS } from "@/design/tokens";

// ─── ScreenBase ───────────────────────────────────────────────────────────────
// The shared visual shell for all ERWIN robot display screens.
// Always renders at 800×480 px (hardware target).

interface ScreenBaseProps {
  children: ReactNode;
}

export function ScreenBase({ children }: ScreenBaseProps) {
  return (
    <div style={{
      width: "800px",
      height: "480px",
      background: "linear-gradient(155deg, #f6fbff 0%, #edf6fc 100%)",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONTS.display,
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(10,140,136,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      {children}
    </div>
  );
}

// ─── ErwinWordmark ────────────────────────────────────────────────────────────

export function ErwinWordmark() {
  return (
    <div style={{
      position: "absolute", top: 18, left: 24,
      fontFamily: FONTS.display,
      fontWeight: 600,
      fontSize: "18px",
      color: COLORS.teal,
      letterSpacing: "0.18em",
      opacity: 0.75,
    }}>
      ERWIN
    </div>
  );
}

// ─── StateLabel ───────────────────────────────────────────────────────────────

interface StateLabelProps {
  label: string;
}

export function StateLabel({ label }: StateLabelProps) {
  return (
    <div style={{
      position: "absolute", top: 18, right: 22,
      fontFamily: FONTS.mono,
      fontSize: "13px",
      color: COLORS.textMuted,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
    }}>
      {label}
    </div>
  );
}

// ─── MainText ─────────────────────────────────────────────────────────────────

interface MainTextProps {
  children: ReactNode;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

export function MainText({ children, size = 32, color = COLORS.textPrimary, style = {} }: MainTextProps) {
  return (
    <div style={{
      fontSize: `${size}px`,
      color,
      fontWeight: 400,
      textAlign: "center",
      lineHeight: 1.35,
      letterSpacing: "-0.01em",
      maxWidth: "620px",
      ...style,
    }}>
      {children}
    </div>
  );
}
