# ERWIN Robot Display Implementation Package

We are preparing the current ERWIN Design Reference Board for handoff to another developer/agent, Codex, which will integrate these designs into the actual ERWIN robot software.

Your task is to transform the CURRENT DESIGN REFERENCE BOARD into a clean, self-contained implementation package that can be exported as a ZIP and handed directly to Codex.

## IMPORTANT

Do NOT redesign the visual language.

Do NOT substantially change the existing visual design.

The current board is the approved visual/design reference for ERWIN's physical robot touchscreen.

Your job is to restructure and prepare the existing implementation so that it is:

* clean
* modular
* understandable
* reusable
* easy to integrate
* clearly mapped to ERWIN's future HRI state machine
* explicit about which UI states exist
* explicit about state-entry/state-exit triggers
* explicit about interactive elements
* explicit about animations
* independent from the current static "all states on one page" reference-board presentation

Codex will handle the actual integration with the ERWIN repository, robot bridge, ROS2, Supabase, sensors, and production state machine.

Do not attempt to invent or implement those external integrations here.

---

# 1. CURRENT DESIGN BOARD

The current project is a React + Vite design reference board showing the complete visual language for ERWIN's 800×480 touchscreen.

It currently contains 13 display-state panels:

01 — Idle
02 — Queued
03 — Navigating
04 — Arriving
05 — Greeting
06 — Choosing Assistance
07 — Sensor Setup
08 — Measuring Heart Rate
09 — Pain Scale
10 — Processing
11 — Complete
12 — Review / Alert
13 — Returning to Base

It also contains:

* State 6.5 — Breathing Exercise
* animation reference cards
* state transition diagram
* design-system documentation
* color palette
* typography
* hardware specifications
* reusable ERWIN face system

The board currently renders all states simultaneously as a reference document.

That is useful for design review but is NOT the final architecture for the physical robot.

---

# 2. TARGET OUTPUT

Convert the current project into a reusable robot-display UI package.

The resulting package should conceptually look like:

src/
components/
ErwinFace
ScreenBase
...
screens/
IdleScreen
QueuedScreen
NavigatingScreen
ArrivingScreen
GreetingScreen
AssistanceSelectionScreen
SensorSetupScreen
MeasuringHeartRateScreen
PainScaleScreen
BreathingExerciseScreen
ProcessingScreen
CompleteScreen
ReviewAlertScreen
ReturningHomeScreen
animations/
...
types/
...
design/
...
README.md

The exact folder structure may be improved if there is a better organization, but maintain a clear separation between:

* reusable visual components
* complete display screens
* animation primitives
* types/interfaces
* design-system constants
* documentation

Do not create unnecessary complexity.

---

# 3. ONE SCREEN AT A TIME

The final implementation package should NOT depend on rendering all 13 screens simultaneously.

Create the screens so that a parent application can conceptually render:

<RobotDisplay state="idle" />

or:

<RobotDisplay state="greeting" />

or:

<RobotDisplay state="measuring_heart_rate" />

The actual state management does not need to be implemented here.

However, the UI architecture must make it obvious that each screen corresponds to a state that can later be controlled by the ERWIN HRI state machine.

Do not build a fake timer-based state machine.

Do not automatically transition through the screens.

Do not simulate the robot lifecycle.

Codex will connect these screens to the real state machine.

---

# 4. STATE IDENTIFIERS

Every display state must have a stable, explicit identifier.

Use a consistent naming convention such as:

idle
queued
navigating
arriving
greeting
choosing_assistance
sensor_setup
measuring_heart_rate
breathing_exercise
pain_scale
processing
complete
review_alert
returning_home

The exact naming may follow existing project conventions if they already exist.

Do not create duplicate identifiers for the same visual state.

Document the mapping between:

DISPLAY STATE
→ human-readable name
→ purpose
→ expected trigger
→ available user interaction
→ next possible state

---

# 5. VERY IMPORTANT: COMMENT THE FUTURE TRIGGERS

Even though this package will not yet be connected to the real state machine, clearly label/comment the code describing WHY each screen is displayed.

For example:

// ERWIN HRI STATE: GREETING
// ENTER TRIGGER:
// Robot has successfully reached the assigned waiting location
// and the outer robot lifecycle has entered the HRI session.
//
// EXPECTED EXIT:
// User acknowledgement OR HRI controller advances session.
//
// INTEGRATION NOTE:
// Actual state transition is controlled externally by the ERWIN HRI state machine.
// This component should only render the current state.

Use this principle for every screen.

The comments should make it easy for Codex to understand:

* what causes this screen to appear
* what user input it expects
* what event should cause it to leave
* whether the state is informational or interactive
* whether the phone is involved
* whether robot hardware/sensors are involved

Do NOT hardcode the actual transition logic.

---

# 6. DISTINGUISH ROBOT DISPLAY FROM PHONE

This is critical.

These designs are for the PHYSICAL ERWIN ROBOT DISPLAY.

They are NOT the patient's phone UI.

The robot has an 800×480 touchscreen.

The patient may simultaneously have a web application open on another device.

The two interfaces must remain conceptually separate.

For every screen, document whether:

ROBOT DISPLAY:

* displays information
* accepts touch input
* waits for sensor data
* waits for HRI controller

PHONE:

* is interactive
* shows processing/loading
* collects input
* is idle

For states where the patient is supposed to interact with ERWIN's physical display, explicitly document:

PHONE SHOULD SHOW:
Processing / waiting state

ROBOT DISPLAY SHOULD SHOW:
Actual HRI interaction

The existing ERWIN processing/loading screen belongs to the patient's other device and should NOT be included as the robot's display implementation.

---

# 7. INTERACTIVE STATES

Clearly identify which screens require touch input.

Examples include:

Choosing Assistance

* Medical Assistance
* Directions / other currently designed option

Pain Scale

* 1–10 selection

Any other currently interactive screen should similarly expose its interaction points.

Do not invent additional interaction options.

For each interactive element, document a semantic event name rather than implementing application logic.

For example:

onAssistanceSelected("medical")

or:

onPainScoreSelected(7)

The actual backend/state-machine behavior should NOT be implemented here.

The important goal is that Codex can easily connect these events to the real HRI controller later.

---

# 8. SENSOR-RELATED SCREENS

Prepare the UI for real sensor integration.

The following screens should expose clear data placeholders/interfaces where appropriate:

Sensor Setup

Measuring Heart Rate

Review / Alert

For example, the heart-rate screen should not permanently depend on a hardcoded BPM.

It should be structured so a parent/controller can eventually provide:

heartRate
measurementStatus
signalQuality
elapsedTime

etc., as appropriate to the existing design.

Do not implement fake sensor readings.

Do not claim sensor data is real.

Use clearly identified placeholder/default values only for design preview.

---

# 9. PAIN SCALE

The Pain Scale screen is a special case.

The final ERWIN system may use the patient's PHONE for pain-scale input.

Therefore, preserve the visual design, but make the component architecture flexible enough that the actual HRI controller can determine whether the interaction is occurring:

* on the robot display
* or through the patient's phone.

Do not hardwire the pain scale to the current mock implementation.

The component should expose a clean semantic event such as:

onPainScoreSelected(score)

---

# 10. BREATHING EXERCISE

Preserve the existing full-resolution breathing exercise design.

This is an important HRI screen.

Preserve:

* face animation
* inhale/exhale orb
* timing
* visual transitions
* typography
* spacing
* animation behavior

The animation should be implemented as a reusable component where practical.

The timing should not require the entire application to be rewritten around it.

Expose meaningful lifecycle callbacks if appropriate, such as:

onExerciseStarted
onExercisePhaseChanged
onExerciseCompleted

Do not implement external robot/session transitions.

---

# 11. ERWIN FACE SYSTEM

Preserve the existing ERWIN face system.

The current design establishes:

* SVG 110×68 viewBox
* two dot eyes
* bar mouth
* modular ErwinFace component
* approximately 12 named expressions

Keep the face modular.

Do not duplicate the SVG into every screen.

Codex should be able to reuse:

<ErwinFace expression="..." />

or the equivalent existing API.

Preserve the existing expressions and visual appearance.

---

# 12. ANIMATION SYSTEM

Preserve the current animation vocabulary.

The board currently establishes animation primitives including:

* blink
* float
* heartbeat
* nav-bob
* orbit
* breathe-orb

and additional named keyframes.

Move these into a clean reusable animation structure where practical.

Do not replace the animations with generic library animations unless absolutely necessary.

The visual behavior shown on the design board is the reference.

Document the purpose of each animation.

For example:

nav-bob
→ communicates robot navigation/movement

orbit
→ communicates processing/thinking

breathe-orb
→ communicates guided breathing exercise

---

# 13. DESIGN SYSTEM

Preserve the established design system:

Background:
#ddeaf5

Primary:
#0c3550

Accent:
#0a8c88

Subtext:
#5a8499

Typography:

Outfit
DM Mono

Hardware target:

800 × 480 px
5" capacitive touchscreen
Elecrow RC050S

Do not introduce arbitrary new colors or fonts.

Centralize reusable design constants where appropriate.

---

# 14. SCREENBASE

Preserve and/or refactor the shared ScreenBase concept.

It should provide the consistent visual shell for robot screens:

* ERWIN wordmark
* state label where appropriate
* consistent spacing
* background
* viewport behavior
* common layout behavior

Individual screens should not duplicate the entire shell.

---

# 15. PREVIEW / DESIGN MODE

The resulting package SHOULD still include a design-preview/development mode so that all screens can be inspected during development.

However:

The preview is only a development/design tool.

The actual application architecture should treat each screen as an independently renderable state.

A useful preview could provide:

* screen selector
* state labels
* optional animation preview
* interactive controls for testing components

Do NOT make the production architecture dependent on the preview board.

---

# 16. RESPONSIVENESS

The physical target is:

800×480.

Prioritize pixel-accurate behavior at this resolution.

The implementation should nevertheless avoid unnecessarily breaking if rendered at slightly different dimensions during development.

Do not redesign the layout around mobile/web responsiveness.

This is a dedicated robot touchscreen UI.

---

# 17. DATA INTERFACES

Where a screen requires dynamic information, define lightweight TypeScript interfaces/props.

Examples:

QueuedScreen:

* queuePosition
* estimatedWait

GreetingScreen:

* patientName

MeasuringHeartRateScreen:

* heartRate
* measurementStatus

ReviewAlertScreen:

* alertLevel
* relevant measurement information

Do not connect these directly to Supabase.

Do not connect these directly to ROS2.

Do not import backend services into presentation components.

The eventual architecture should be:

HRI STATE MACHINE
↓
SCREEN PROPS / EVENTS
↓
ROBOT DISPLAY UI

NOT:

SCREEN
→ Supabase
→ ROS2
→ robot

---

# 18. NO BACKEND OR ROS2 IMPLEMENTATION

Do NOT implement:

* Supabase connections
* ROS2 publishers
* ROS2 subscribers
* robot bridge communication
* Nav2
* sensor drivers
* computer vision
* patient authentication
* database writes

Those belong to the main ERWIN application/repository and will be integrated by Codex.

You are preparing the visual/UI package that those systems will consume.

---

# 19. DOCUMENTATION FOR CODEX

Create a README.md specifically explaining how another developer should integrate this package.

Include:

## What this package contains

Explain that this is the ERWIN robot-display UI implementation.

## Hardware target

800×480 touchscreen.

## Screens

Provide a table:

| ID | State | Interactive? | Main Input | Expected Controller Trigger |
| -- | ----- | ------------ | ---------- | --------------------------- |

## Component architecture

Explain:

Robot HRI State Machine
→ Screen
→ Components
→ Animation primitives

## Events

List all semantic events emitted by interactive screens.

## Dynamic data

List the props/data expected by each screen.

## State triggers

Document the intended state entry/exit conditions without implementing the state machine.

## Integration warnings

Explicitly tell Codex:

* do not duplicate the HRI state machine
* do not move backend logic into UI components
* do not connect UI directly to ROS2
* preserve the existing ERWIN state-machine architecture
* use these screens as presentation components
* replace preview/hardcoded values with real controller data during integration

---

# 20. REMOVE DESIGN-BOARD-ONLY ARCHITECTURE

The existing board is designed as a visual reference document.

It is acceptable for the package to retain a preview mode, but the implementation should no longer depend on:

"render every screen vertically on one page."

Instead, establish a clean screen registry or equivalent structure so the eventual application can render one active screen.

For example:

RobotDisplay
→ current HRI state
→ corresponding screen

Do not implement the actual state-machine transitions.

---

# 21. EXPORT REQUIREMENTS

When complete, prepare the project so it can be exported as a ZIP containing:

* source code
* components
* screens
* animations
* styles
* assets
* TypeScript types
* README.md
* integration documentation

Do NOT include:

* node_modules
* build caches
* unnecessary generated files
* secrets
* environment credentials
* Supabase keys
* unrelated Figma Make artifacts

The ZIP should be a clean developer handoff package.

---

# 22. FINAL QUALITY CHECK

Before considering the package complete, verify:

1. Every existing design state is represented.
2. The visual design remains faithful to the current board.
3. The 800×480 target is preserved.
4. Animations remain functional.
5. ERWIN Face remains reusable.
6. Screens are independently renderable.
7. Interactive elements emit semantic events.
8. Dynamic data uses props/interfaces rather than hardcoded application logic.
9. Future state-machine triggers are clearly commented/documented.
10. Robot display and patient phone are clearly separated.
11. No ROS2/backend/database logic has been embedded into UI components.
12. The package can be handed to Codex without requiring the entire Figma reference board to remain part of the production application.
13. The README explains exactly how Codex should integrate the package.
14. No secrets or environment credentials are included.

The most important objective is:

TAKE THE EXISTING ERWIN DESIGN REFERENCE BOARD

and turn it into:

A CLEAN, MODULAR, STATE-ORIENTED ROBOT DISPLAY UI PACKAGE

that preserves the current visual design and animations while providing clear interfaces for the real ERWIN HRI state machine to control it later.

Do not redesign the product.

Do not implement the robot backend.

Do not implement the state machine.

Prepare the UI implementation for integration.
