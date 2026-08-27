// ─── ERWIN Design System — Tokens ─────────────────────────────────────────────
// Hardware target: Elecrow RC050S · 800 × 480 px · 5" capacitive touchscreen
// Do not introduce new colors or typefaces without updating this file.

export const COLORS = {
  // Screen background
  screenBg:      "#f2f9fd",
  boardBg:       "#ddeaf5",

  // Typography
  textPrimary:   "#0c2840",
  textSecondary: "#5a8499",
  textMuted:     "#94b8c8",

  // Brand / accent
  teal:          "#0a8c88",
  tealDim:       "rgba(10,140,136,0.45)",
  amber:         "#cc7a0a",
  amberLight:    "#f5a020",
  violet:        "#7a5fcf",

  // Face
  faceStroke:    "#c8dce8",
  faceBg1:       "#ffffff",
  faceBg2:       "#eef5fb",
  dotColor:      "#0c3550",

  // Borders / dividers
  border:        "#c8dce8",
  borderSubtle:  "rgba(10,140,136,0.14)",
} as const;

export const FONTS = {
  display: "'Outfit', sans-serif",
  mono:    "'DM Mono', monospace",
} as const;

export const DISPLAY = {
  width:  800,
  height: 480,
} as const;

// Face geometry — viewBox 0 0 110 68
export const FACE = {
  FW: 110, FH: 68,
  FCX: 55,
  LEX: 27, REX: 83,
  DEY: 34,
  BASE_R: 8,
} as const;
