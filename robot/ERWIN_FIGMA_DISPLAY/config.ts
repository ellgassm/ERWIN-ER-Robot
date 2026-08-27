export interface RobotConfig {
  robotId: string;
  apiBaseUrl: string;
}

/** Robot-process configuration; ROS2-specific settings belong in the bridge adapter. */
export function getRobotConfig(env: Record<string, string | undefined>): RobotConfig {
  return {
    robotId: env.ROBOT_ID ?? "",
    apiBaseUrl: env.ERWIN_API_BASE_URL ?? "",
  };
}
