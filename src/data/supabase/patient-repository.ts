import type { PatientRepository } from "@/data/repositories";
import type { Patient } from "@/shared/domain";

import { getSupabaseClient } from "./client";
import type { PatientRow } from "./rows";

function toPatient(row: PatientRow): Patient {
  return {
    patientId: row.patient_id,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    createdAt: row.created_at,
  };
}

export class SupabasePatientRepository implements PatientRepository {
  async findById(patientId: string): Promise<Patient | null> {
    const { data, error } = await getSupabaseClient()
      .schema("robotics")
      .from("patients")
      .select("patient_id, first_name, last_name, date_of_birth, created_at")
      .eq("patient_id", patientId)
      .maybeSingle<PatientRow>();

    if (error) throw error;
    return data ? toPatient(data) : null;
  }

  async create(input: { firstName: string; lastName: string; dateOfBirth: string }): Promise<Patient> {
    const { data, error } = await getSupabaseClient()
      .schema("robotics")
      .from("patients")
      .insert({
        first_name: input.firstName,
        last_name: input.lastName,
        date_of_birth: input.dateOfBirth,
      })
      .select("patient_id, first_name, last_name, date_of_birth, created_at")
      .single<PatientRow>();

    if (error) throw error;
    return toPatient(data);
  }
}

export const patientRepository = new SupabasePatientRepository();
