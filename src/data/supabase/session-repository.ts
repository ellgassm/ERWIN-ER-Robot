import type { SessionRepository } from "@/data/repositories";
import type { ERWINSession } from "@/shared/domain";
import type { SessionStatus } from "@/shared/session";

import { getSupabaseClient } from "./client";
import type { SessionRow } from "./rows";

function toSession(row: SessionRow): ERWINSession {
  return {
    sessionId: row.session_id,
    patientId: row.patient_id ?? undefined,
    locationId: row.location_id,
    status: row.status,
    requestedAt: row.requested_at,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
  };
}

const sessionColumns = "session_id, patient_id, location_id, status, requested_at, started_at, completed_at";

export class SupabaseSessionRepository implements SessionRepository {
  async create(input: { locationId: string; patientId?: string }): Promise<ERWINSession> {
    const { data, error } = await getSupabaseClient()
      .schema("robotics")
      .from("erwin_sessions")
      .insert({ location_id: input.locationId, patient_id: input.patientId ?? null, status: "requested" })
      .select(sessionColumns)
      .single<SessionRow>();

    if (error) throw error;
    return toSession(data);
  }

  async findById(sessionId: string): Promise<ERWINSession | null> {
    const { data, error } = await getSupabaseClient()
      .schema("robotics")
      .from("erwin_sessions")
      .select(sessionColumns)
      .eq("session_id", sessionId)
      .maybeSingle<SessionRow>();

    if (error) throw error;
    return data ? toSession(data) : null;
  }

  async findQueued(): Promise<ERWINSession[]> {
    const { data, error } = await getSupabaseClient()
      .schema("robotics")
      .from("erwin_sessions")
      .select(sessionColumns)
      .eq("status", "queued")
      .order("requested_at", { ascending: true });

    if (error) throw error;
    return (data as SessionRow[]).map(toSession);
  }

  async updateStatus(sessionId: string, status: SessionStatus): Promise<ERWINSession> {
    const timestamps =
      status === "navigating" ? { started_at: new Date().toISOString() } : status === "completed" ? { completed_at: new Date().toISOString() } : {};
    const { data, error } = await getSupabaseClient()
      .schema("robotics")
      .from("erwin_sessions")
      .update({ status, ...timestamps })
      .eq("session_id", sessionId)
      .select(sessionColumns)
      .single<SessionRow>();

    if (error) throw error;
    return toSession(data);
  }
}

export const sessionRepository = new SupabaseSessionRepository();
