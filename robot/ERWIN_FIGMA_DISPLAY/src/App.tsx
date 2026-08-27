// ─── ERWIN Design Preview Board ───────────────────────────────────────────────
//
// DEVELOPMENT / DESIGN TOOL ONLY.
//
// This file is the design reference board. It renders all screens simultaneously
// for review and is NOT the production entrypoint.
//
// The production entrypoint is:
//   import RobotDisplay from "@/RobotDisplay";
//   <RobotDisplay state={currentHriState} {...screenProps} />
//
// The preview board also includes a live screen selector that lets you render
// any single screen at full 800×480 resolution.

import { ReactNode, useState } from "react";
import RobotDisplay from "@/RobotDisplay";
import type { ErwinDisplayState } from "@/types/erwin";
import { COLORS, FONTS } from "@/design/tokens";

// ─── Preview wrapper — scales 800×480 to fit a board cell ────────────────────

function DisplayPanel({ label, stateNum, children, fullWidth = false }: {
  label: string; stateNum: string; children: ReactNode; fullWidth?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontFamily: FONTS.mono, fontSize: "11px", color: COLORS.teal, letterSpacing: "0.08em", background: "rgba(10,140,136,0.1)", padding: "3px 8px", borderRadius: "4px", border: "1px solid rgba(10,140,136,0.25)" }}>
          {stateNum}
        </span>
        <span style={{ fontFamily: FONTS.mono, fontSize: "11px", color: COLORS.textSecondary, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
      <div style={{
        width: fullWidth ? "800px" : "400px",
        height: fullWidth ? "480px" : "240px",
        borderRadius: "12px",
        background: "#f2f9fd",
        border: "1.5px solid #c8dce8",
        boxShadow: "0 0 0 4px #ddeaf5, 0 4px 24px rgba(12,40,64,0.08)",
        overflow: "hidden",
        position: "relative",
        flexShrink: 0,
      }}>
        <div style={{
          width: "800px", height: "480px",
          transform: fullWidth ? "none" : "scale(0.5)",
          transformOrigin: "top left",
          position: "absolute", top: 0, left: 0,
        }}>
          {children}
        </div>
      </div>
      <div style={{ fontFamily: FONTS.mono, fontSize: "10px", color: "#94b8c8", letterSpacing: "0.05em" }}>
        800 × 480 px · RC050S Elecrow 5"
      </div>
    </div>
  );
}

// ─── Screen selector (single-state preview) ───────────────────────────────────

const ALL_STATES: { id: ErwinDisplayState; label: string; num: string }[] = [
  { id: "idle",                 label: "Idle",                  num: "01" },
  { id: "queued",               label: "Queued",                num: "02" },
  { id: "navigating",           label: "Navigating",            num: "03" },
  { id: "arriving",             label: "Arriving",              num: "04" },
  { id: "greeting",             label: "Greeting",              num: "05" },
  { id: "choosing_assistance",  label: "Choosing Assistance",   num: "06" },
  { id: "sensor_setup",         label: "Sensor Setup",          num: "07" },
  { id: "measuring_heart_rate", label: "Measuring Heart Rate",  num: "08" },
  { id: "pain_scale",           label: "Pain Scale",            num: "09" },
  { id: "breathing_exercise",   label: "Breathing Exercise",    num: "6.5" },
  { id: "processing",           label: "Processing",            num: "10" },
  { id: "complete",             label: "Complete",              num: "11" },
  { id: "review_alert",         label: "Review / Alert",        num: "12" },
  { id: "returning_home",       label: "Returning Home",        num: "13" },
];

function ScreenSelector() {
  const [active, setActive] = useState<ErwinDisplayState>("idle");
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  return (
    <section style={{ padding: "0 60px 80px" }}>
      <div style={{ borderLeft: "3px solid #0a8c88", paddingLeft: "20px", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 600, color: COLORS.textPrimary, margin: 0, letterSpacing: "-0.02em" }}>Live Screen Preview</h2>
        <p style={{ fontSize: "14px", color: "#7aacbf", margin: "4px 0 0", fontFamily: FONTS.mono }}>Select a state to preview at full resolution</p>
      </div>

      {/* State pill selector */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" }}>
        {ALL_STATES.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            style={{
              fontFamily: FONTS.mono,
              fontSize: "11px",
              letterSpacing: "0.08em",
              padding: "6px 14px",
              borderRadius: "20px",
              border: `1.5px solid ${active === s.id ? COLORS.teal : "rgba(10,140,136,0.25)"}`,
              background: active === s.id ? "rgba(10,140,136,0.12)" : "transparent",
              color: active === s.id ? COLORS.teal : COLORS.textSecondary,
              cursor: "pointer",
            }}
          >
            {s.num} {s.label}
          </button>
        ))}
      </div>

      {/* Event log — shows semantic events fired by interactive screens */}
      {lastEvent && (
        <div style={{ marginBottom: "16px", fontFamily: FONTS.mono, fontSize: "12px", color: COLORS.teal, background: "rgba(10,140,136,0.07)", padding: "10px 16px", borderRadius: "8px", border: "1px solid rgba(10,140,136,0.2)" }}>
          Event fired: {lastEvent}
        </div>
      )}

      {/* Full-resolution preview */}
      <div style={{
        width: "800px", height: "480px",
        borderRadius: "16px",
        overflow: "hidden",
        border: "2px solid #c8dce8",
        boxShadow: "0 0 0 6px #ddeaf5, 0 8px 40px rgba(12,40,64,0.1)",
      }}>
        <RobotDisplay
          state={active}
          // Preview placeholder data — replace with real controller data on integration
          queuePosition={2}
          estimatedWait="~3 min"
          patientName="Alex"
          heartRate={undefined}
          measurementStatus="measuring"
          alertLevel="caution"
          alertHeartRate={110}
          interactionMode="robot_display"
          onAssistanceSelected={(type) => setLastEvent(`onAssistanceSelected("${type}")`)}
          onPainScoreSelected={(score) => setLastEvent(`onPainScoreSelected(${score})`)}
          onExerciseStarted={() => setLastEvent("onExerciseStarted()")}
          onExercisePhaseChanged={(phase) => setLastEvent(`onExercisePhaseChanged("${phase}")`)}
          onExerciseCompleted={() => setLastEvent("onExerciseCompleted()")}
        />
      </div>
    </section>
  );
}

// ─── All-states reference grid ────────────────────────────────────────────────

function AllStatesGrid() {
  const entries = [
    { num:"01",  label:"IDLE",               el: <RobotDisplay state="idle" /> },
    { num:"02",  label:"QUEUED",             el: <RobotDisplay state="queued" queuePosition={2} estimatedWait="~3 min" /> },
    { num:"03",  label:"NAVIGATING",         el: <RobotDisplay state="navigating" /> },
    { num:"04",  label:"ARRIVING",           el: <RobotDisplay state="arriving" /> },
    { num:"05",  label:"GREETING",           el: <RobotDisplay state="greeting" patientName="Alex" /> },
    { num:"06",  label:"CHOOSING ASSISTANCE",el: <RobotDisplay state="choosing_assistance" onAssistanceSelected={() => {}} /> },
    { num:"07",  label:"SENSOR SETUP",       el: <RobotDisplay state="sensor_setup" /> },
    { num:"08",  label:"MEASURING HEART RATE",el:<RobotDisplay state="measuring_heart_rate" measurementStatus="measuring" /> },
    { num:"09",  label:"PAIN SCALE",         el: <RobotDisplay state="pain_scale" onPainScoreSelected={() => {}} /> },
    { num:"10",  label:"PROCESSING",         el: <RobotDisplay state="processing" /> },
    { num:"11",  label:"COMPLETE",           el: <RobotDisplay state="complete" /> },
    { num:"12",  label:"REVIEW / ALERT",     el: <RobotDisplay state="review_alert" alertLevel="caution" alertHeartRate={110} /> },
    { num:"13",  label:"RETURNING TO BASE",  el: <RobotDisplay state="returning_home" /> },
  ];

  return (
    <section style={{ padding: "0 60px" }}>
      <div style={{ borderLeft: "3px solid #0a8c88", paddingLeft: "20px", marginBottom: "40px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 600, color: COLORS.textPrimary, margin: 0, letterSpacing: "-0.02em" }}>Display States</h2>
        <p style={{ fontSize: "14px", color: "#7aacbf", margin: "4px 0 0", fontFamily: FONTS.mono }}>All 13 operating states at 1:2 scale — live animations active</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 400px)", gap: "36px 28px" }}>
        {entries.map(s => (
          <DisplayPanel key={s.num} label={s.label} stateNum={s.num}>{s.el}</DisplayPanel>
        ))}
      </div>
    </section>
  );
}

function BreathingSection() {
  return (
    <section style={{ padding: "60px 60px 0" }}>
      <div style={{ borderLeft: "3px solid #0a8c88", paddingLeft: "20px", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 600, color: COLORS.textPrimary, margin: 0, letterSpacing: "-0.02em" }}>State 6.5 — Breathing Exercise</h2>
        <p style={{ fontSize: "14px", color: "#7aacbf", margin: "4px 0 0", fontFamily: FONTS.mono }}>Full-resolution panel · 8 s inhale/exhale loop · face synced to orb</p>
      </div>
      <DisplayPanel label="BREATHING EXERCISE" stateNum="6.5" fullWidth>
        <RobotDisplay state="breathing_exercise" />
      </DisplayPanel>
      <div style={{ marginTop: "14px", fontSize: "13px", color: "#7aacbf", fontFamily: FONTS.mono, maxWidth: "800px", lineHeight: 1.6 }}>
        Orb expands (scale 0.48 → 1.0) and contracts over 8 s. Face wrapper uses the same 8 s timing class (erwin-face-breathe-sync). Three rings stagger by 2.66 s. Extend to 2+ min by looping in Rive or WebM.
      </div>
    </section>
  );
}

// ─── Board header ─────────────────────────────────────────────────────────────

function BoardHeader() {
  return (
    <header style={{ padding: "60px 60px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: "13px", color: COLORS.teal, letterSpacing: "0.15em", background: "rgba(10,140,136,0.1)", padding: "4px 12px", borderRadius: "4px", border: "1px solid rgba(10,140,136,0.25)" }}>DESIGN PREVIEW</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: "13px", color: "#94b8c8", letterSpacing: "0.08em" }}>Development tool only · not the production entrypoint</div>
          </div>
          <h1 style={{ fontSize: "52px", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, color: COLORS.textPrimary, margin: 0 }}>ERWIN</h1>
          <h2 style={{ fontSize: "18px", fontWeight: 300, color: COLORS.textSecondary, letterSpacing: "0.08em", margin: "8px 0 0", textTransform: "uppercase" }}>Emergency Room Waiting-room Interactive Node</h2>
          <p style={{ fontSize: "15px", color: "#7aacbf", marginTop: "16px", maxWidth: "520px", lineHeight: 1.6 }}>
            Robot display UI package. Use <code style={{ background: "rgba(10,140,136,0.1)", padding: "1px 6px", borderRadius: "4px", fontFamily: FONTS.mono, fontSize: "13px" }}>&lt;RobotDisplay state="…" /&gt;</code> in production.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: "11px", color: "#94b8c8", letterSpacing: "0.1em", marginBottom: "4px" }}>PALETTE</div>
          {[
            { color: COLORS.screenBg,      name: "Screen BG" },
            { color: COLORS.teal,          name: "Teal Primary" },
            { color: COLORS.amber,         name: "Amber Accent" },
            { color: COLORS.violet,        name: "Violet Calm" },
            { color: COLORS.textPrimary,   name: "Text Primary" },
            { color: COLORS.textSecondary, name: "Text Secondary" },
          ].map(p => (
            <div key={p.name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: "11px", color: "#94b8c8" }}>{p.name}</span>
              <div style={{ width: "32px", height: "18px", borderRadius: "4px", background: p.color, border: "1px solid rgba(12,40,64,0.12)" }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: "0", marginTop: "36px", borderTop: "1px solid rgba(10,140,136,0.15)", paddingTop: "20px" }}>
        {[
          ["Display",    "Elecrow RC050S · 5\" Capacitive Touch"],
          ["Resolution", "800 × 480 px"],
          ["Font",       "Outfit · DM Mono"],
          ["Scheme",     "Light · Teal + Amber"],
          ["Animation",  "CSS / SVG / Rive-compatible"],
        ].map(([k, v], i, arr) => (
          <div key={k} style={{ paddingRight: "32px", marginRight: "32px", borderRight: i < arr.length - 1 ? "1px solid rgba(10,140,136,0.15)" : "none" }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: "10px", color: "#94b8c8", letterSpacing: "0.1em", marginBottom: "4px" }}>{k}</div>
            <div style={{ fontSize: "13px", color: COLORS.textSecondary }}>{v}</div>
          </div>
        ))}
      </div>
    </header>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.boardBg, paddingBottom: "80px" }}>
      <BoardHeader />
      <div style={{ height: "1px", background: "rgba(10,140,136,0.12)", margin: "0 60px" }} />
      <div style={{ height: "60px" }} />

      {/* Live screen selector */}
      <ScreenSelector />
      <div style={{ height: "1px", background: "rgba(10,140,136,0.12)", margin: "0 60px 60px" }} />

      {/* All-states reference grid */}
      <AllStatesGrid />
      <BreathingSection />
    </div>
  );
}
