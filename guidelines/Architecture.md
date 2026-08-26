# ERWIN Architecture

## Status

This document records the foundation established in Phase 1. It distinguishes architecture and interfaces created in this phase from application features intentionally deferred to later phases.

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

Only directories with Phase 1 files are created. Backend and robot implementation directories remain deferred until their first implementation phase.

## Frontend architecture

The frontend remains Vite, React, TypeScript, Tailwind-related styling, Motion, Lucide, and the existing shadcn/ui primitives. The current Figma Make screens remain in `src/app/App.tsx` as prototype UI work; feature screens should be extracted into `src/features/` in the phase where they become functional.

`src/main.tsx` is the application entry point. `@/*` resolves to `src/*` and should be preferred over deeply nested relative imports.

UI components render state and invoke application-facing interfaces. They should not contain scattered database queries, robot commands, physical coordinates, or service-role credentials.

## Backend and data access

The intended backend is one thin trusted API layer, implemented later as the simplest deployment option for the team. It validates requests, resolves location codes, creates sessions, enforces session transitions, and records measurements.

`src/data/repositories.ts` defines the application-facing repository boundaries. A future Supabase adapter or backend service implements these interfaces. The patient UI should not directly scatter raw Supabase queries across components.

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

`src/shared/contracts/robot.ts` defines application-level robot contracts. A future robot bridge will claim queued assignments, translate a `NavigationTarget` into a Nav2 goal, and report application events. ROS2 topics, actions, map files, sensor drivers, and TurtleBot-specific details belong only in the robot bridge/adapter.

The navigation target contains `locationId`, `mapId`, `x`, `y`, and `yaw`. These values come from waiting-location data, never from patient-facing components.

## Shared domain types

`src/shared/domain.ts` defines domain-oriented types for patients, waiting locations, triage assessments, sessions, measurements, navigation targets, and robot status. These types are intentionally not a blind export of database rows.

`src/shared/session.ts` centralizes the session lifecycle:

```text
requested -> queued -> navigating -> interacting -> measuring -> review -> completed
                                                       \-> cancelled
```

The lifecycle is a contract in Phase 1. Transition enforcement and workflow behavior are future work.

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

## Implemented in Phase 1

- Restored the Vite React entry point.
- Added strict TypeScript configuration and the `@/*` path mapping.
- Added public environment configuration parsing.
- Added domain types and centralized session/measurement/robot contracts.
- Added repository interfaces for future data-access adapters.
- Added architecture documentation.
- Preserved the existing Figma Make UI, styling, and shadcn/ui components.

## Planned for future phases

- QR URL/location resolution
- patient identification
- session creation and queue behavior
- API implementation and Supabase adapter
- polling
- robot bridge and ROS2/Nav2 integration
- onboard display/audio interaction
- PPG measurement integration
- pain collection
- baseline comparison
- staff review and alert handling

## Development phases

1. Foundation and environment — this phase
2. Real QR/location resolution and session API
3. Persistent session status and queue polling
4. Simulated robot bridge
5. TurtleBot3/ROS2/Nav2 integration
6. Patient interaction and measurements
7. Baseline comparison and staff review
