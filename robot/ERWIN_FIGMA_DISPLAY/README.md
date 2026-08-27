# ERWIN Robot Display UI Package

React + TypeScript UI package for the **ERWIN** (Emergency Room Waiting-room Interactive Node) autonomous robot's 800×480 touchscreen.

**Hardware target:** Elecrow RC050S · 5" capacitive touch · 800 × 480 px

---

## What this package contains

- **`src/RobotDisplay.tsx`** — Top-level component. Renders the correct screen for a given HRI state.
- **`src/screens/`** — One file per display state, each independently renderable.
- **`src/components/`** — Shared primitives: `ErwinFace`, `BreathingFace`, `ScreenBase`.
- **`src/design/tokens.ts`** — Design system constants (colors, fonts, display dimensions).
- **`src/types/erwin.ts`** — TypeScript interfaces for all states, props, and events.
- **`src/App.tsx`** — Design preview board (development tool; not the production entrypoint).
- **`src/index.css`** — Global CSS including all animation keyframes.

---

## Usage

```tsx
import RobotDisplay from "@/RobotDisplay";

// Render the active HRI state
<RobotDisplay state={currentHriState} {...screenProps} />
```

The `state` prop controls which screen is shown. Pass screen-specific props alongside it:

```tsx
<RobotDisplay
  state="measuring_heart_rate"
  heartRate={72}
  measurementStatus="measuring"
/>

<RobotDisplay
  state="choosing_assistance"
  onAssistanceSelected={(type) => hriController.handleAssistance(type)}
/>
```

---

## Screens

| # | State ID | Label | Interactive? | Main Input | Trigger |
|---|----------|-------|:---:|---|---|
| 01 | `idle` | Idle | — | None | Robot assigned to patient |
| 02 | `queued` | Queued | — | None | Nav task accepted |
| 03 | `navigating` | Navigating | — | None | Nav2 goal in progress |
| 04 | `arriving` | Arriving | — | None | Nav2 goal reached |
| 05 | `greeting` | Greeting | — | None | HRI session starts |
| 06 | `choosing_assistance` | Choosing Assistance | ✓ | `onAssistanceSelected` | Greeting complete |
| 07 | `sensor_setup` | Sensor Setup | — | None | Patient chose vitals |
| 08 | `measuring_heart_rate` | Measuring Heart Rate | — | Sensor data | Sensor ready |
| 09 | `pain_scale` | Pain Scale | ✓ (or phone) | `onPainScoreSelected` | HRI controller decision |
| 6.5 | `breathing_exercise` | Breathing Exercise | — | Lifecycle callbacks | Patient chose breathing |
| 10 | `processing` | Processing | — | None | Backend call in progress |
| 11 | `complete` | Complete | — | None | Session ends normally |
| 12 | `review_alert` | Review / Alert | — | None | Flagged measurement |
| 13 | `returning_home` | Returning Home | — | None | Session complete |

---

## Component architecture

```
ERWIN HRI State Machine
  ↓ state prop + screen props/callbacks
RobotDisplay (src/RobotDisplay.tsx)
  ↓ selects correct screen
Screen component (src/screens/*.tsx)
  ↓ composes
Shared components (ErwinFace, ScreenBase, BreathingFace)
  ↓ uses
Design tokens (src/design/tokens.ts)
CSS animations (src/index.css)
```

---

## Events

Interactive screens emit semantic events. Wire these to the HRI controller:

| Screen | Event | Payload |
|--------|-------|---------|
| `AssistanceSelectionScreen` | `onAssistanceSelected` | `"vitals" \| "breathing"` |
| `PainScaleScreen` | `onPainScoreSelected` | `number` (1–10) |
| `BreathingExerciseScreen` | `onExerciseStarted` | — |
| `BreathingExerciseScreen` | `onExercisePhaseChanged` | `"inhale" \| "exhale"` |
| `BreathingExerciseScreen` | `onExerciseCompleted` | — |

---

## Dynamic data (props per screen)

| Screen | Props | Source |
|--------|-------|--------|
| `QueuedScreen` | `queuePosition`, `estimatedWait` | Task assignment system |
| `GreetingScreen` | `patientName` | Patient session record (Supabase) |
| `MeasuringHeartRateScreen` | `heartRate`, `measurementStatus`, `signalQuality`, `elapsedTime` | PPG sensor bridge / ROS2 topic |
| `ReviewAlertScreen` | `alertLevel`, `heartRate`, `notes` | HRI controller evaluation |
| `PainScaleScreen` | `interactionMode` | HRI controller decision |

---

## State entry / exit conditions

Each screen file (`src/screens/*.tsx`) contains a top-of-file comment block:

```
// ERWIN HRI STATE: <NAME>
// ENTER TRIGGER: …
// EXPECTED EXIT: …
// ROBOT DISPLAY: …
// PHONE: …
// INTEGRATION NOTE: …
```

Read these comments before wiring a screen to the state machine.

---

## Robot display vs. phone

These screens are for the **physical ERWIN robot display only**.

The patient's phone is a separate web application. They are never the same component.

| State | Robot display | Patient phone |
|-------|--------------|---------------|
| `idle` | Ambient waiting animation | N/A |
| `choosing_assistance` | Touch-interactive selection | Idle / waiting |
| `measuring_heart_rate` | Live BPM + waveform | "Measurement in progress…" |
| `pain_scale` | Touch grid (or waiting msg) | Pain input UI (if interactionMode === "phone") |
| `processing` | ERWIN thinking animation | Phone's own loading state |
| `review_alert` | Care team notification | "A nurse has been notified" |

---

## Integration warnings for Codex

1. **Do not duplicate the HRI state machine.** State transitions are controlled externally. These components only render the current state.
2. **Do not move backend logic into UI components.** No Supabase calls, ROS2 publishers, or Nav2 commands belong here.
3. **Do not connect UI directly to ROS2.** The HRI controller reads ROS2 topics and passes data down as props.
4. **Preserve the existing ERWIN state-machine architecture.** These screens are presentation components at the leaf of the data flow.
5. **Replace preview/placeholder values with real controller data.** `heartRate={undefined}`, `patientName="Alex"`, etc. in `App.tsx` are preview stubs only.
6. **The pain scale interaction mode is not yet decided.** `interactionMode` lets the controller choose at runtime. Default to `"robot_display"` until the phone UI exists.
7. **`App.tsx` is the preview board, not the entrypoint.** In the robot application, import `RobotDisplay` directly.

---

## Design system

| Token | Value |
|-------|-------|
| Screen background | `#f2f9fd` |
| Board background | `#ddeaf5` |
| Teal primary | `#0a8c88` |
| Amber accent | `#cc7a0a` |
| Text primary | `#0c2840` |
| Text secondary | `#5a8499` |
| Display font | Outfit |
| Mono font | DM Mono |
| Hardware | Elecrow RC050S · 800 × 480 · 5" capacitive |

---

## Development preview

Run `pnpm dev` (or the project's Vite dev command). The preview board renders all states simultaneously plus a live screen selector at the top of the page.
