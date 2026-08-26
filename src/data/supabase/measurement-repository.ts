import type { MeasurementRepository } from "@/data/repositories";
import type { Measurement } from "@/shared/domain";

import { getSupabaseClient } from "./client";
import type { MeasurementRow } from "./rows";

function toMeasurement(row: MeasurementRow): Measurement {
  return {
    measurementId: row.measurement_id,
    sessionId: row.session_id,
    type: row.type,
    value: Number(row.value),
    recordedAt: row.recorded_at,
  };
}

export class SupabaseMeasurementRepository implements MeasurementRepository {
  async record(input: Omit<Measurement, "measurementId" | "recordedAt">): Promise<Measurement> {
    const { data, error } = await getSupabaseClient()
      .schema("robotics")
      .from("measurements")
      .insert({ session_id: input.sessionId, type: input.type, value: input.value })
      .select("measurement_id, session_id, type, value, recorded_at")
      .single<MeasurementRow>();

    if (error) throw error;
    return toMeasurement(data);
  }
}

export const measurementRepository = new SupabaseMeasurementRepository();
