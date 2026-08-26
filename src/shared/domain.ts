import type { SessionStatus } from "./session";

export type MeasurementType = "heart_rate" | "pain";

export interface Patient {
  patientId: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  createdAt: string;
}

export interface NavigationTarget {
  locationId: string;
  mapId: string;
  x: number;
  y: number;
  yaw: number;
}

export interface WaitingLocation {
  locationId: string;
  locationCode: string;
  name?: string;
  navigationTarget: NavigationTarget;
  createdAt: string;
}

export interface TriageAssessment {
  triageId: string;
  patientId: string;
  type: MeasurementType;
  value: number;
  recordedAt: string;
}

export interface ERWINSession {
  sessionId: string;
  patientId?: string;
  locationId: string;
  status: SessionStatus;
  requestedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Measurement {
  measurementId: string;
  sessionId: string;
  type: MeasurementType;
  value: number;
  recordedAt: string;
}

export type RobotStatus =
  | "home"
  | "going_to_seat"
  | "at_seat"
  | "service_complete"
  | "returning_home"
  | "error";
