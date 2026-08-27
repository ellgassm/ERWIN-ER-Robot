# ERWIN Agent Instructions

## 1. Read Before Working

Before making changes, read:

1. AGENTS.md
2. guidelines/Guidelines.md
3. guidelines/Architecture.md if it exists
4. Relevant source files
5. supabase/schema.sql when database behavior is involved

Do not make architectural assumptions without inspecting the existing repository.

---

## 2. Project Context

ERWIN is a healthcare robotics hackathon prototype built around:

- TurtleBot3 Burger
- LiDAR
- ROS2
- Nav2
- SLAM
- React
- TypeScript
- Vite
- Supabase PostgreSQL

The system connects:

Patient
→ QR code
→ Mobile web application
→ Application/backend layer
→ Supabase
→ Robot bridge
→ ROS2/Nav2
→ TurtleBot3

The project prioritizes a reliable hackathon MVP over production-level complexity.

---

## 3. Core Engineering Rules

- Prefer the simplest working solution.
- Do not over-engineer.
- Preserve existing working code.
- Preserve useful Figma Make and shadcn/ui components.
- Do not change frameworks without a concrete technical reason.
- Do not introduce dependencies without justification.
- Keep changes focused on the requested task.
- Do not rewrite unrelated parts of the application.
- Use TypeScript consistently.
- Prefer explicit domain types and interfaces.
- Keep application logic separate from UI components.
- Keep robot/ROS2 logic isolated from the patient-facing frontend.

---

## 4. Architecture Rules

The browser must NOT directly control ROS2.

The patient application communicates application-level intent.

The robot integration layer translates that intent into robot behavior.

Conceptually:

Patient Web
→ Application/API
→ Supabase / Robot Bridge
→ ROS2
→ Nav2
→ TurtleBot3

Waiting-room coordinates must not be hardcoded into frontend components.

Use:

location_code
→ waiting_locations
→ NavigationTarget
→ robot
→ Nav2

---

## 5. Database Rules

The existing Supabase schema is a shared contract.

Primary tables:

- patients
- waiting_locations
- triage_assessments
- erwin_sessions
- measurements

Do not modify the schema casually.

Before changing database structure:

1. Explain why the change is necessary.
2. Determine whether the requirement can be solved in application code.
3. Consider existing relationships and future scalability.
4. Document meaningful schema changes.

Measurements should be historical records and should not overwrite previous observations.

---

## 6. Environment Variables

Never commit secrets.

.env.local must remain untracked.

.env.example may contain variable names but must never contain real credentials.

The Supabase service-role key is server-side only.

Never expose it through client-side code or variables intended for the browser.

---

## 7. Change Discipline

For non-trivial changes:

1. Inspect the relevant implementation.
2. Identify affected files.
3. Make the smallest reasonable change.
4. Run validation.
5. Report what changed.

Do not automatically refactor unrelated code.

Do not delete existing files unless they are confirmed to be obsolete.

---

## 8. Feature Development

Develop ERWIN in vertical slices.

Preferred progression:

1. Project foundation
2. QR/location resolution
3. Session creation
4. Session queue
5. Robot communication
6. Navigation
7. Robot display/HRI
8. Heart-rate measurement
9. Pain scale
10. Baseline comparison
11. Alerts

Do not implement future phases while working on an earlier phase unless explicitly requested.

---

## 9. Robotics

ROS2-specific implementation belongs in the robotics integration layer.

The web application should deal with abstractions such as:

- NavigationTarget
- RobotStatus
- ERWINSession

rather than ROS2-specific messages or commands.

Do not attempt to connect to physical hardware unless explicitly requested.

---

## 10. Validation

After making changes, run the appropriate:

- TypeScript checks
- build
- lint
- tests, if available

If validation fails, determine whether the failure was caused by your changes before modifying unrelated code.

---

## 11. Communication

When reporting completed work, provide:

- What changed
- Why it changed
- Files created/modified
- Dependencies changed
- Validation performed
- Known limitations
- Recommended next step

Do not claim functionality is implemented if it has only been architected or scaffolded.

---

## 11.5 Robotics State Machine Philosophy

### Autonomous Operation Is the Default

ERWIN's normal demonstration and production flow must be autonomous.

The robot should not require a human operator to manually advance the queue or decide when to return home during normal operation.

The intended lifecycle is:


HOME
  ↓
queued request detected
  ↓
GOING_TO_SEAT
  ↓
Nav2 navigation succeeds
  ↓
AT_SEAT / INTERACTING
  ↓
HRI session occurs
  ↓
SERVICE_COMPLETE
  ↓
queued request exists?
  ├─ YES → next FIFO request → GOING_TO_SEAT
  └─ NO  → HOME

---

## 12. Stop Conditions

If a requested change would require a major architectural decision not covered by the existing documentation:

STOP and explain the decision that needs to be made.

Do not silently choose a significantly different architecture.

Likewise, if implementation requires changing the database schema, authentication model, framework, or robot communication architecture, explain the proposed change before proceeding.