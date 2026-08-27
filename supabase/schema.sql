-- ============================================================
-- ERWIN - Hackathon Supabase Database Schema
-- ============================================================
--
-- This is a hackathon/prototype database. Row Level Security is
-- intentionally disabled below. Do not use this configuration with
-- real patient information.
--
-- Anonymous sessions use erwin_sessions.patient_id = NULL.
-- Identified sessions reference robotics.patients(patient_id).
-- ============================================================
-- SCHEMAS & EXTENSIONS
-- ============================================================
CREATE SCHEMA IF NOT EXISTS robotics;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. PATIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS robotics.patients (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. WAITING LOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS robotics.waiting_locations (
    location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_code TEXT NOT NULL UNIQUE,
    name TEXT,
    map_id TEXT,
    x DOUBLE PRECISION NOT NULL,
    y DOUBLE PRECISION NOT NULL,
    yaw DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. TRIAGE ASSESSMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS robotics.triage_assessments (
    triage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    type TEXT NOT NULL,
    value NUMERIC NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_triage_patient
        FOREIGN KEY (patient_id)
        REFERENCES robotics.patients(patient_id)
        ON DELETE CASCADE,

    CONSTRAINT triage_type_check
        CHECK (type IN ('heart_rate', 'pain')),

    CONSTRAINT triage_value_check
        CHECK (
            (type = 'heart_rate' AND value >= 0 AND value <= 300) OR
            (type = 'pain' AND value >= 0 AND value <= 10)
        )
);

-- ============================================================
-- 4. ERWIN SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS robotics.erwin_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID,
    location_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    CONSTRAINT fk_session_patient
        FOREIGN KEY (patient_id)
        REFERENCES robotics.patients(patient_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_session_location
        FOREIGN KEY (location_id)
        REFERENCES robotics.waiting_locations(location_id)
        ON DELETE RESTRICT,

    CONSTRAINT session_status_check
        CHECK (
            status IN (
                'requested', 'queued', 'navigating', 
                'interacting', 'measuring', 'review', 
                'completed', 'cancelled'
            )
        )
);

-- Preserve anonymous-session support when upgrading an older database.
ALTER TABLE robotics.erwin_sessions
ALTER COLUMN patient_id DROP NOT NULL;

-- ============================================================
-- 5. MEASUREMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS robotics.measurements (
    measurement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    type TEXT NOT NULL,
    value NUMERIC NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_measurement_session
        FOREIGN KEY (session_id)
        REFERENCES robotics.erwin_sessions(session_id)
        ON DELETE CASCADE,

    CONSTRAINT measurement_type_check
        CHECK (type IN ('heart_rate', 'pain')),

    CONSTRAINT measurement_value_check
        CHECK (
            (type = 'heart_rate' AND value >= 0 AND value <= 300) OR
            (type = 'pain' AND value >= 0 AND value <= 10)
        )
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_triage_patient_id ON robotics.triage_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_patient_id ON robotics.erwin_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_location_id ON robotics.erwin_sessions(location_id);
CREATE INDEX IF NOT EXISTS idx_measurements_session_id ON robotics.measurements(session_id);
CREATE INDEX IF NOT EXISTS idx_measurements_session_recorded ON robotics.measurements(session_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_triage_patient_recorded ON robotics.triage_assessments(patient_id, recorded_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_waiting_locations_code ON robotics.waiting_locations(location_code);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON robotics.erwin_sessions(status);

-- ============================================================
-- HACKATHON ACCESS CONFIGURATION
-- ============================================================
--
-- RLS is intentionally disabled for the local hackathon MVP so the
-- browser anon client can exercise the complete prototype workflow.
-- Production ERWIN must use authenticated, least-privilege access,
-- server-side privileged operations, and audit logging.
-- ============================================================
ALTER TABLE robotics.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE robotics.waiting_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE robotics.triage_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE robotics.erwin_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE robotics.measurements DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read patients" ON robotics.patients;
DROP POLICY IF EXISTS "public read locations" ON robotics.waiting_locations;
DROP POLICY IF EXISTS "public read triage" ON robotics.triage_assessments;
DROP POLICY IF EXISTS "public read sessions" ON robotics.erwin_sessions;
DROP POLICY IF EXISTS "public read measurements" ON robotics.measurements;

-- The MVP uses polling and intentionally does not add tables to
-- supabase_realtime.

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO robotics.waiting_locations (
    location_code, name, map_id, x, y, yaw
)
VALUES (
    'A12', 'Waiting Area A12', 'er_map', 0.0, 0.0, 0.0
)
ON CONFLICT (location_code) DO NOTHING;

-- Docked robot home pose. This is robot configuration, not a patient QR
-- destination. Positive X is north on the current map, so yaw 0 faces north.
INSERT INTO robotics.waiting_locations (
    location_code, name, map_id, x, y, yaw
)
VALUES (
    'HOME', 'TurtleBot Home Dock', 'er_map', -0.02098032273352146, -0.028868287801742554, 0.0
)
ON CONFLICT (location_code) DO UPDATE
SET
    name = EXCLUDED.name,
    map_id = EXCLUDED.map_id,
    x = EXCLUDED.x,
    y = EXCLUDED.y,
    yaw = EXCLUDED.yaw;

-- Current SLAM-map seat targets.
-- Coordinates are expressed in the `map` frame. Based on the observed
-- navigation test, +x points north and +y points west on this map. Therefore
-- north-facing HOME is yaw 0 and west-facing seats use yaw = pi / 2 radians.
INSERT INTO robotics.waiting_locations (
    location_code, name, map_id, x, y, yaw
)
VALUES
    ('SEAT1', 'Waiting Seat 1', 'er_map', 2.2925310134887695, -0.10433311015367508, 1.5707963267948966),
    ('SEAT2', 'Waiting Seat 2', 'er_map', 3.48934006690979, -0.11032122373580933, 1.5707963267948966)
ON CONFLICT (location_code) DO UPDATE
SET
    name = EXCLUDED.name,
    map_id = EXCLUDED.map_id,
    x = EXCLUDED.x,
    y = EXCLUDED.y,
    yaw = EXCLUDED.yaw;

-- ============================================================
-- 7. ROBOT STATE AND COMMANDS
-- ============================================================
-- The bridge owns robot orchestration state. Commands are persisted so an
-- operator can explicitly release a seat assignment or send the robot home.
-- This is intentionally simple for the hackathon's single-robot deployment.
CREATE TABLE IF NOT EXISTS robotics.robot_states (
    robot_id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'home',
    active_session_id UUID,
    error_message TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_robot_state_session
        FOREIGN KEY (active_session_id)
        REFERENCES robotics.erwin_sessions(session_id)
        ON DELETE SET NULL,

    CONSTRAINT robot_status_check
        CHECK (status IN ('home', 'going_to_seat', 'at_seat', 'service_complete', 'returning_home', 'error'))
);

CREATE TABLE IF NOT EXISTS robotics.robot_commands (
    command_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    robot_id TEXT NOT NULL DEFAULT 'erwin-1',
    command TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    CONSTRAINT robot_command_check
        CHECK (command IN ('NEXT', 'HOME')),

    CONSTRAINT robot_command_status_check
        CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Keep existing installations in sync when this file is re-run.
ALTER TABLE robotics.robot_states DROP CONSTRAINT IF EXISTS robot_status_check;
ALTER TABLE robotics.robot_states
    ADD CONSTRAINT robot_status_check
    CHECK (status IN ('home', 'going_to_seat', 'at_seat', 'service_complete', 'returning_home', 'error'));

CREATE INDEX IF NOT EXISTS idx_robot_commands_pending
    ON robotics.robot_commands(robot_id, status, created_at);

ALTER TABLE robotics.robot_states DISABLE ROW LEVEL SECURITY;
ALTER TABLE robotics.robot_commands DISABLE ROW LEVEL SECURITY;

INSERT INTO robotics.robot_states (robot_id, status)
VALUES ('erwin-1', 'home')
ON CONFLICT (robot_id) DO NOTHING;
