#!/usr/bin/env python3
"""ERWIN support-PC bridge: Supabase queued sessions to Nav2.

This process is intentionally the only ERWIN component that imports ROS 2/Nav2
types. It polls Supabase, resolves a session's waiting location, sends a real
NavigateToPose goal, and writes the actual result back to Supabase.
"""

import json
import math
import os
import threading
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import rclpy
from action_msgs.msg import GoalStatus
from nav2_msgs.action import NavigateToPose
from rclpy.action import ActionClient
from rclpy.node import Node
from geometry_msgs.msg import PoseStamped


@dataclass(frozen=True)
class NavigationTarget:
    location_id: str
    location_code: str
    map_id: str | None
    frame_id: str
    x: float
    y: float
    yaw: float


@dataclass(frozen=True)
class SessionAssignment:
    session_id: str
    location_id: str
    target: NavigationTarget


class SupabaseRestClient:
    def __init__(self, url: str, service_role_key: str, schema: str = "robotics") -> None:
        if not url or not service_role_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
        self.base_url = url.rstrip("/") + "/rest/v1"
        self.headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
            "Accept-Profile": schema,
            "Content-Profile": schema,
        }
        self._lock = threading.Lock()

    def request(self, method: str, table: str, query: dict[str, str], body: Any = None) -> list[dict[str, Any]]:
        query_string = urllib.parse.urlencode(query)
        request = urllib.request.Request(
            f"{self.base_url}/{table}?{query_string}",
            method=method,
            headers={**self.headers, "Prefer": "return=representation"},
            data=json.dumps(body).encode("utf-8") if body is not None else None,
        )
        with self._lock, urllib.request.urlopen(request, timeout=10) as response:
            payload = response.read().decode("utf-8")
        return json.loads(payload) if payload else []

    def next_queued_assignment(self, frame_id: str) -> SessionAssignment | None:
        sessions = self.request(
            "GET",
            "erwin_sessions",
            {
                "select": "session_id,location_id",
                "status": "eq.queued",
                "order": "requested_at.asc",
                "limit": "1",
            },
        )
        if not sessions:
            return None

        session = sessions[0]
        locations = self.request(
            "GET",
            "waiting_locations",
            {
                "select": "location_id,location_code,map_id,x,y,yaw",
                "location_id": f"eq.{session['location_id']}",
                "limit": "1",
            },
        )
        if not locations:
            raise ValueError(f"No waiting location found for session {session['session_id']}")

        location = locations[0]
        return SessionAssignment(
            session_id=session["session_id"],
            location_id=location["location_id"],
            target=NavigationTarget(
                location_id=location["location_id"],
                location_code=location["location_code"],
                map_id=location.get("map_id"),
                frame_id=frame_id,
                x=float(location["x"]),
                y=float(location["y"]),
                yaw=float(location["yaw"]),
            ),
        )

    def update_session(self, session_id: str, from_status: str, status: str) -> bool:
        rows = self.request(
            "PATCH",
            "erwin_sessions",
            {"session_id": f"eq.{session_id}", "status": f"eq.{from_status}"},
            {"status": status, **self._timestamps(status)},
        )
        return bool(rows)

    @staticmethod
    def _timestamps(status: str) -> dict[str, str]:
        now = datetime.now(timezone.utc).isoformat()
        if status == "navigating":
            return {"started_at": now}
        if status == "completed":
            return {"completed_at": now}
        return {}


class ErwinRobotBridge(Node):
    def __init__(self, database: SupabaseRestClient) -> None:
        super().__init__("erwin_robot_bridge")
        self.database = database
        self.frame_id = os.getenv("ERWIN_NAVIGATION_FRAME", "map")
        self.poll_interval = float(os.getenv("ERWIN_POLL_INTERVAL_SECONDS", "2"))
        self.action_client = ActionClient(self, NavigateToPose, "/navigate_to_pose")
        self.active_session_id: str | None = None
        self.active_goal_handle = None
        self.timer = self.create_timer(self.poll_interval, self.poll_queue)
        self.get_logger().info(
            f"ERWIN bridge ready: action=/navigate_to_pose frame={self.frame_id} poll={self.poll_interval}s"
        )

    def poll_queue(self) -> None:
        if self.active_session_id is not None:
            return

        try:
            assignment = self.database.next_queued_assignment(self.frame_id)
            if assignment is None:
                return
            if not self.action_client.wait_for_server(timeout_sec=0.5):
                self.get_logger().warning("Nav2 /navigate_to_pose is not available; leaving session queued")
                return
            if not self.database.update_session(assignment.session_id, "queued", "navigating"):
                self.get_logger().info(f"Session {assignment.session_id} was claimed by another bridge")
                return

            self.active_session_id = assignment.session_id
            self.get_logger().info(
                f"Navigating session {assignment.session_id} to {assignment.target.location_code} "
                f"({assignment.target.x}, {assignment.target.y}, {assignment.target.yaw})"
            )
            self.send_navigation_goal(assignment.target)
        except (OSError, urllib.error.URLError, ValueError, KeyError) as error:
            self.get_logger().error(f"Bridge poll failed: {error}")

    def send_navigation_goal(self, target: NavigationTarget) -> None:
        pose = PoseStamped()
        pose.header.frame_id = target.frame_id
        pose.header.stamp = self.get_clock().now().to_msg()
        pose.pose.position.x = target.x
        pose.pose.position.y = target.y
        pose.pose.orientation.z = math.sin(target.yaw / 2.0)
        pose.pose.orientation.w = math.cos(target.yaw / 2.0)

        goal = NavigateToPose.Goal()
        goal.pose = pose
        future = self.action_client.send_goal_async(goal)
        future.add_done_callback(self.goal_response_callback)

    def goal_response_callback(self, future) -> None:
        try:
            goal_handle = future.result()
        except Exception as error:  # noqa: BLE001 - ROS future errors are runtime-dependent
            self.fail_active_session(f"Nav2 goal submission failed: {error}")
            return
        if not goal_handle.accepted:
            self.fail_active_session("Nav2 rejected the navigation goal")
            return
        self.active_goal_handle = goal_handle
        result_future = goal_handle.get_result_async()
        result_future.add_done_callback(self.navigation_result_callback)

    def navigation_result_callback(self, future) -> None:
        session_id = self.active_session_id
        if session_id is None:
            return
        try:
            result = future.result().status
            if result == GoalStatus.STATUS_SUCCEEDED:
                self.database.update_session(session_id, "navigating", "interacting")
                self.get_logger().info(f"Session {session_id} arrived; status set to interacting")
            else:
                self.database.update_session(session_id, "navigating", "cancelled")
                self.get_logger().error(f"Session {session_id} navigation ended with status {result}")
        except (OSError, urllib.error.URLError) as error:
            self.get_logger().error(f"Could not write navigation result: {error}")
        finally:
            self.active_goal_handle = None
            self.active_session_id = None

    def fail_active_session(self, message: str) -> None:
        self.get_logger().error(message)
        if self.active_session_id is not None:
            try:
                self.database.update_session(self.active_session_id, "navigating", "cancelled")
            except (OSError, urllib.error.URLError) as error:
                self.get_logger().error(f"Could not mark failed session cancelled: {error}")
        self.active_goal_handle = None
        self.active_session_id = None


def main() -> None:
    rclpy.init()
    database = SupabaseRestClient(
        os.getenv("SUPABASE_URL", ""),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        os.getenv("SUPABASE_DB_SCHEMA", "robotics"),
    )
    bridge = ErwinRobotBridge(database)
    try:
        rclpy.spin(bridge)
    finally:
        bridge.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
