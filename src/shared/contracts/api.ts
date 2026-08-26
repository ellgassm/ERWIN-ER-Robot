import type { ERWINSession, Measurement, WaitingLocation } from "../domain";

export interface ResolveLocationRequest {
  locationCode: string;
}

export interface ResolveLocationResponse {
  location: WaitingLocation;
}

export interface CreateSessionRequest {
  locationCode: string;
  patientId?: string;
}

export interface CreateSessionResponse {
  session: ERWINSession;
}

export interface RecordMeasurementRequest {
  type: Measurement["type"];
  value: number;
}

export interface SessionStatusResponse {
  session: ERWINSession;
}
