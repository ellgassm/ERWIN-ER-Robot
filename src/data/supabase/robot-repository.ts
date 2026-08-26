import { getSupabaseClient } from "./client";

export type RobotStatus = "home" | "going_to_seat" | "at_seat" | "service_complete" | "returning_home" | "error";
export type RobotCommand = "NEXT" | "HOME";

export interface RobotState {
  robotId: string;
  status: RobotStatus;
  activeSessionId?: string;
  errorMessage?: string;
  updatedAt: string;
}

interface RobotStateRow {
  robot_id: string;
  status: RobotStatus;
  active_session_id: string | null;
  error_message: string | null;
  updated_at: string;
}

function toRobotState(row: RobotStateRow): RobotState {
  return {
    robotId: row.robot_id,
    status: row.status,
    activeSessionId: row.active_session_id ?? undefined,
    errorMessage: row.error_message ?? undefined,
    updatedAt: row.updated_at,
  };
}

export class SupabaseRobotRepository {
  async getState(robotId = "erwin-1"): Promise<RobotState | null> {
    const { data, error } = await getSupabaseClient()
      .schema("robotics")
      .from("robot_states")
      .select("robot_id, status, active_session_id, error_message, updated_at")
      .eq("robot_id", robotId)
      .maybeSingle<RobotStateRow>();

    if (error) throw error;
    return data ? toRobotState(data) : null;
  }

  async issueCommand(command: RobotCommand, robotId = "erwin-1"): Promise<void> {
    const { error } = await getSupabaseClient()
      .schema("robotics")
      .from("robot_commands")
      .insert({ robot_id: robotId, command, status: "pending" });

    if (error) throw error;
  }
}

export const robotRepository = new SupabaseRobotRepository();
