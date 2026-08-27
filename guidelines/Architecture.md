# ERWIN Architecture

## Status

This document records the foundation established in Phases 1 through 3. It distinguishes implemented architecture from application features intentionally deferred to later phases.

## System overview

ERWIN consists of a patient-facing mobile web application, a thin application/backend layer, Supabase as the system of record, and a robot communication bridge that translates application intent into ROS2/Nav2 operations.

```text
Patient phone
  -> Vite/React patient web app
  -> application/backend API
  -> Supabase PostgreSQL
  <- robot communication bridge
  -> ROS2/Nav2
  -> TurtleBot3 Burger
```

The patient application communicates only in application-level terms. It does not connect directly to ROS2, Nav2, robot hardware, or sensor drivers.

## Final directory responsibilities

```text
src/
  app/                    Application shell and existing prototype UI
  app/components/ui/      Preserved shadcn/ui primitives
  config/                 Public browser configuration
  data/                   Data-access repository interfaces
  shared/                 Domain types and cross-boundary contracts
  styles/                 Existing ERWIN/Tailwind styling

supabase/                 Database schema and future migrations
backend/                  Trusted API configuration and future API implementation
robot/                    Robot-process configuration and future bridge implementation
guidelines/               Project and architecture documentation
```

The `backend/` directory remains reserved for a future trusted API. The `robot/bridge/` directory now contains the first support-PC bridge implementation; it is intentionally independent from browser code.

## Frontend architecture

The frontend remains Vite, React, TypeScript, Tailwind-related styling, Motion, Lucide, and the existing shadcn/ui primitives. The current Figma Make screens remain in `src/app/App.tsx` as prototype UI work; feature screens should be extracted into `src/features/` in the phase where they become functional.

`src/main.tsx` is the application entry point. `@/*` resolves to `src/*` and should be preferred over deeply nested relative imports.

UI components render state and invoke application-facing interfaces. They should not contain scattered database queries, robot commands, physical coordinates, or service-role credentials.

The `/` entry point is a QR-instruction landing screen. The `/request?location=<LOCATION_CODE>` entry point reads only the location code from the URL and resolves the corresponding waiting location through the data-access boundary. The route does not create a session or communicate with the robot. The original Figma Make prototype remains available only at `/prototype` as a design reference and is not part of the real patient flow.

## Backend and data access

The intended backend is one thin trusted API layer, implemented later as the simplest deployment option for the team. It validates requests, resolves location codes, creates sessions, enforces session transitions, and records measurements.

`src/data/repositories.ts` defines the application-facing repository boundaries. A future Supabase adapter or backend service implements these interfaces. The patient UI should not directly scatter raw Supabase queries across components.

Phase 2 adds a browser-safe `SupabaseLocationRepository` implementation for the `robotics.waiting_locations` lookup. It maps database column names into the domain `WaitingLocation` and `NavigationTarget` types. Other repositories remain interfaces only.

Phase 3 adds typed Supabase repositories for patients, sessions, measurements, and triage baselines. The patient-facing workflow creates an anonymous or identified session only when the patient requests ERWIN, then polls the session state from Supabase.

## Supabase boundary

Supabase remains the system of record for the existing baseline entities:

```text
patients 1---* triage_assessments
patients 1---* erwin_sessions
waiting_locations 1---* erwin_sessions
erwin_sessions 1---* measurements
```

The current `supabase/schema.sql` is the data-model baseline. Security policies and migration practices must be hardened before exposing patient data or production-like workflows. The browser must never use the service-role key.

## Robot and ROS2/Nav2 boundary

`src/shared/contracts/robot.ts` defines application-level robot contracts. `robot/bridge/erwin_robot_bridge.py` claims the oldest queued assignment through Supabase REST, resolves its database-backed `NavigationTarget`, sends a standard Nav2 `NavigateToPose` goal, and writes the actual action result back to Supabase. ROS2 topics, actions, map files, sensor drivers, and TurtleBot-specific details belong only in this bridge.

The bridge persists one `robotics.robot_states` row per robot and polls `robotics.robot_commands` for optional `NEXT` and `HOME` overrides. A successful seat navigation changes the session to `interacting` and the robot to `at_seat`; the active assignment is intentionally retained. When the session becomes `completed` or `cancelled`, the bridge records `service_complete`, evaluates the persistent FIFO queue, and autonomously dispatches the next request or returns home when the queue is empty. `NEXT` releases/skips the current service and invokes that same queue-evaluation path; `HOME` is a safety override that sends the documented home pose through Nav2.

The navigation target contains `locationId`, `mapId`, `x`, `y`, and `yaw`. These values come from waiting-location data, never from patient-facing components.

## Shared domain types

`src/shared/domain.ts` defines domain-oriented types for patients, waiting locations, triage assessments, sessions, measurements, navigation targets, and robot status. These types are intentionally not a blind export of database rows.

`src/shared/session.ts` centralizes the session lifecycle:

```text
 requested -> queued -> navigating -> interacting -> measuring -> review -> completed
                                                       \-> cancelled
```

The lifecycle is a shared contract. The patient application displays the persisted lifecycle, while the support-PC bridge owns the `queued` → `navigating` → `interacting` transition based on actual Nav2 availability and action results. Patient interaction owns the later measurement/review/completion transitions for this phase.

The robot lifecycle is separate from the session lifecycle:

```text
home -> going_to_seat -> at_seat -> service_complete
                                      ├-> going_to_seat (next queued request)
                                      └-> returning_home -> home (queue empty)

at_seat -> service_complete (NEXT override)
at_seat -> returning_home -> home (HOME override)
```

`at_seat` is persistent and does not advance merely because Nav2 succeeded. The current HRI completion event is the patient session becoming `completed` after the existing measurement/review flow. The demo-only `/operator` route inserts optional override commands into Supabase; it is unauthenticated and must not be used with real patient data.

## Environment configuration

`.env.example` documents:

- `VITE_SUPABASE_URL`: public browser configuration
- `VITE_SUPABASE_ANON_KEY`: public browser key, subject to RLS
- `SUPABASE_URL`: trusted backend configuration
- `SUPABASE_SERVICE_ROLE_KEY`: server-only secret
- `ROBOT_ID`: robot-process identity
- `ERWIN_API_BASE_URL`: robot bridge API endpoint

Server code reads trusted settings through `backend/config.ts`. Robot-process settings are isolated in `robot/config.ts`; ROS2-specific settings will be added inside the bridge adapter when robot integration begins.

Vite exposes variables prefixed with `VITE_`, so the client configuration uses that convention. The service-role key must exist only in trusted backend/robot processes and must never be imported by code under `src/`.

The real `.env.local` remains ignored by Git.

## Implemented in Phases 1, 2, and 3

- Restored the Vite React entry point.
- Added strict TypeScript configuration and the `@/*` path mapping.
- Added public environment configuration parsing.
- Added domain types and centralized session/measurement/robot contracts.
- Added repository interfaces for future data-access adapters.
- Added architecture documentation.
- Preserved the existing Figma Make UI, styling, and shadcn/ui components.
- Added the `/request?location=...` location-resolution route.
- Added Vite public Supabase client configuration and a typed waiting-location repository.
- Added loading, missing/unknown-location, and database-error UI states.
- Synchronized the repository schema with the hackathon configuration: anonymous sessions, disabled RLS, no Realtime dependency, and seeded A12.
- Added patient, session, measurement, and triage repositories.
- Added optional identified-patient creation and anonymous session creation.
- Added session polling, queue position display, cancellation, refresh persistence, and understandable error states.
- Added the support-PC ROS2/Nav2 bridge with autonomous queue progression and database-backed HOME resolution; physical navigation remains unverified until the bridge is run in the configured TurtleBot3 environment.
- Added pain-scale and controlled mock heart-rate measurement recording.
- Added baseline lookup and simple non-clinical comparison display.
- Added the first robot-side HRI boundary: a UI-independent in-memory HRI
  state machine initialized after confirmed seat arrival, with display/input
  adapter protocols kept separate from ROS2 and React.

## Planned for future phases

- API implementation and server-side authorization
- robot bridge hardening, controlled Nav2 testing, and physical TurtleBot3 verification
- onboard display/audio interaction
- PPG measurement integration
- staff review and alert handling

## Development phases

1. Foundation and environment
2. Real QR/location resolution
3. Persistent patient workflow, queue, measurements, and robot orchestration — this phase
4. TurtleBot3/ROS2/Nav2 integration and controlled physical verification
5. Production authorization and staff review
