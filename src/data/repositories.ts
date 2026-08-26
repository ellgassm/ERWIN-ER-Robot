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
  create(input: { firstName: string; lastName: string; dateOfBirth: string }): Promise<Patient>;
}

export interface SessionRepository {
  create(input: { locationId: string; patientId?: string }): Promise<ERWINSession>;
  findById(sessionId: string): Promise<ERWINSession | null>;
  findQueued(): Promise<ERWINSession[]>;
  updateStatus(sessionId: string, status: ERWINSession["status"]): Promise<ERWINSession>;
}

export interface MeasurementRepository {
  record(input: Omit<Measurement, "measurementId" | "recordedAt">): Promise<Measurement>;
}

export interface TriageRepository {
  findByPatientId(patientId: string): Promise<TriageAssessment[]>;
}
