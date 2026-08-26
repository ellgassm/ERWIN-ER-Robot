import type { MeasurementType } from "@/shared/domain";
import type { SessionStatus } from "@/shared/session";

export interface PatientRow {
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  created_at: string;
}

export interface SessionRow {
  session_id: string;
  patient_id: string | null;
  location_id: string;
  status: SessionStatus;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface MeasurementRow {
  measurement_id: string;
  session_id: string;
  type: MeasurementType;
  value: number;
  recorded_at: string;
}

export interface TriageRow {
  triage_id: string;
  patient_id: string;
  type: MeasurementType;
  value: number;
  recorded_at: string;
}
