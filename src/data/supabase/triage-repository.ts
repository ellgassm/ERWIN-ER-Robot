import type { TriageRepository } from "@/data/repositories";
import type { TriageAssessment } from "@/shared/domain";

import { getSupabaseClient } from "./client";
import type { TriageRow } from "./rows";

function toTriage(row: TriageRow): TriageAssessment {
  return {
    triageId: row.triage_id,
    patientId: row.patient_id,
    type: row.type,
    value: Number(row.value),
    recordedAt: row.recorded_at,
  };
}

export class SupabaseTriageRepository implements TriageRepository {
  async findByPatientId(patientId: string): Promise<TriageAssessment[]> {
    const { data, error } = await getSupabaseClient()
      .schema("robotics")
      .from("triage_assessments")
      .select("triage_id, patient_id, type, value, recorded_at")
      .eq("patient_id", patientId)
      .order("recorded_at", { ascending: true });

    if (error) throw error;
    return (data as TriageRow[]).map(toTriage);
  }
}

export const triageRepository = new SupabaseTriageRepository();
