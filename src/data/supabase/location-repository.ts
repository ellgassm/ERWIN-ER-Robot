import type { LocationRepository } from "@/data/repositories";
import type { NavigationTarget, WaitingLocation } from "@/shared/domain";

import { getSupabaseClient } from "./client";

interface WaitingLocationRow {
  location_id: string;
  location_code: string;
  name: string | null;
  map_id: string | null;
  x: number;
  y: number;
  yaw: number;
  created_at: string;
}

function toWaitingLocation(row: WaitingLocationRow): WaitingLocation {
  const navigationTarget: NavigationTarget = {
    locationId: row.location_id,
    mapId: row.map_id ?? "",
    x: row.x,
    y: row.y,
    yaw: row.yaw,
  };

  return {
    locationId: row.location_id,
    locationCode: row.location_code,
    name: row.name ?? undefined,
    navigationTarget,
    createdAt: row.created_at,
  };
}

export class SupabaseLocationRepository implements LocationRepository {
  async findByCode(locationCode: string): Promise<WaitingLocation | null> {
    const { data, error } = await getSupabaseClient()
      .schema("robotics")
      .from("waiting_locations")
      .select("location_id, location_code, name, map_id, x, y, yaw, created_at")
      // QR codes are human-readable identifiers; tolerate case differences
      // while the database remains the source of truth for the record.
      .ilike("location_code", locationCode)
      .maybeSingle<WaitingLocationRow>();

    if (error) throw error;
    return data ? toWaitingLocation(data) : null;
  }
}

export const locationRepository = new SupabaseLocationRepository();
