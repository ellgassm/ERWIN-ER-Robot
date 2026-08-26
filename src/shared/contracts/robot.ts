import type { ERWINSession, NavigationTarget, RobotStatus } from "../domain";

export interface RobotAssignment {
  sessionId: string;
  locationId: string;
  navigationTarget: NavigationTarget;
}

export interface RobotState {
  status: RobotStatus;
  activeSessionId?: string;
  updatedAt: string;
}

export interface RobotEvent {
  sessionId: string;
  status: ERWINSession["status"];
  occurredAt: string;
  errorMessage?: string;
}

/** Application-level robot boundary. ROS2/Nav2 adapters implement this later. */
export interface RobotGateway {
  getNextAssignment(): Promise<RobotAssignment | null>;
  reportEvent(event: RobotEvent): Promise<void>;
}
