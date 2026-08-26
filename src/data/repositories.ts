import type {
  ERWINSession,
  Measurement,
  Patient,
  TriageAssessment,
  WaitingLocation,
} from "@/shared/domain";

export interface LocationRepository {
  findByCode(locationCode: string): Promise<WaitingLocation | null>;
}

export interface PatientRepository {
  findById(patientId: string): Promise<Patient | null>;
}

export interface SessionRepository {
  create(input: { locationId: string; patientId?: string }): Promise<ERWINSession>;
  findById(sessionId: string): Promise<ERWINSession | null>;
  findQueued(): Promise<ERWINSession[]>;
}

export interface MeasurementRepository {
  record(input: Omit<Measurement, "measurementId" | "recordedAt">): Promise<Measurement>;
}

export interface TriageRepository {
  findByPatientId(patientId: string): Promise<TriageAssessment[]>;
}
