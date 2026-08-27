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
import time
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

from hri import HriCoordinator


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


@dataclass(frozen=True)
class RobotCommand:
    command_id: str
    robot_id: str
    command: str


class SupabaseRestClient:
    def __init__(self, url: str, service_role_key: str, schema: str = "robotics") -> None:
        if not url or not service_role_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
        self.base_url = url.rstrip("/") + "/rest/v1"
        self.headers = {
            "apikey": service_role_key,
            "Content-Type": "application/json",
            "Accept-Profile": schema,
            "Content-Profile": schema,
        }
        # Supabase's new sb_secret_* keys must not be sent as Bearer tokens.
        # Keep Bearer support for legacy JWT service_role keys.
        if not service_role_key.startswith("sb_secret_"):
            self.headers["Authorization"] = f"Bearer {service_role_key}"
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

    def get_session_status(self, session_id: str) -> str | None:
        rows = self.request(
            "GET",
            "erwin_sessions",
            {"select": "status", "session_id": f"eq.{session_id}", "limit": "1"},
        )
        return rows[0].get("status") if rows else None

    def get_robot_state(self, robot_id: str) -> dict[str, Any] | None:
        rows = self.request(
            "GET",
            "robot_states",
            {
                "select": "robot_id,status,active_session_id,error_message",
                "robot_id": f"eq.{robot_id}",
                "limit": "1",
            },
        )
        return rows[0] if rows else None

    def navigation_target_for_code(self, location_code: str, frame_id: str) -> NavigationTarget:
        locations = self.request(
            "GET",
            "waiting_locations",
            {
                "select": "location_id,location_code,map_id,x,y,yaw",
                "location_code": f"eq.{location_code}",
                "limit": "1",
            },
        )
        if not locations:
            raise ValueError(f"No waiting location found for {location_code}")
        location = locations[0]
        return NavigationTarget(
            location_id=location["location_id"],
            location_code=location["location_code"],
            map_id=location.get("map_id"),
            frame_id=frame_id,
            x=float(location["x"]),
            y=float(location["y"]),
            yaw=float(location["yaw"]),
        )

    def update_robot_state(
        self,
        robot_id: str,
        status: str,
        active_session_id: str | None = None,
        error_message: str | None = None,
    ) -> None:
        self.request(
            "PATCH",
            "robot_states",
            {"robot_id": f"eq.{robot_id}"},
            {
                "status": status,
                "active_session_id": active_session_id,
                "error_message": error_message,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
        )

    def next_pending_command(self, robot_id: str) -> RobotCommand | None:
        rows = self.request(
            "GET",
            "robot_commands",
            {
                "select": "command_id,robot_id,command",
                "robot_id": f"eq.{robot_id}",
                "status": "eq.pending",
                "order": "created_at.asc",
                "limit": "1",
            },
        )
        if not rows:
            return None
        row = rows[0]
        return RobotCommand(row["command_id"], row["robot_id"], row["command"])

    def claim_command(self, command_id: str) -> bool:
        return bool(
            self.request(
                "PATCH",
                "robot_commands",
                {"command_id": f"eq.{command_id}", "status": "eq.pending"},
                {"status": "processing"},
            )
        )

    def finish_command(self, command_id: str, status: str, error_message: str | None = None) -> None:
        self.request(
            "PATCH",
            "robot_commands",
            {"command_id": f"eq.{command_id}", "status": "eq.processing"},
            {
                "status": status,
                "error_message": error_message,
                "processed_at": datetime.now(timezone.utc).isoformat(),
            },
        )

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
        self.robot_id = os.getenv("ROBOT_ID") or "erwin-1"
        self.poll_interval = float(os.getenv("ERWIN_POLL_INTERVAL_SECONDS", "2"))
        self.action_client = ActionClient(self, NavigateToPose, "/navigate_to_pose")
        self.active_session_id: str | None = None
        self.active_target: NavigationTarget | None = None
        self.active_mode: str | None = None
        self.active_goal_handle = None
        self.pending_command_id: str | None = None
        self.robot_status = "home"
        self.navigation_goal_generation = 0
        self.retry_delay = float(os.getenv("ERWIN_RETRY_DELAY_SECONDS", "5"))
        self.retry_at: float | None = None
        self.retry_count = 0
        self.hri_coordinator = HriCoordinator()
        self.restore_persisted_state()
        self.timer = self.create_timer(self.poll_interval, self.poll_queue)
        self.get_logger().info(
            f"ERWIN bridge ready: robot={self.robot_id} action=/navigate_to_pose "
            f"frame={self.frame_id} poll={self.poll_interval}s"
        )

    def restore_persisted_state(self) -> None:
        try:
            persisted = self.database.get_robot_state(self.robot_id)
            if not persisted:
                self.database.update_robot_state(self.robot_id, "home")
                return

            persisted_status = persisted.get("status", "home")
            persisted_session_id = persisted.get("active_session_id")
            if persisted_status == "at_seat":
                if not persisted_session_id:
                    self.robot_status = "error"
                    self.database.update_robot_state(
                        self.robot_id,
                        "error",
                        error_message="Robot reported at_seat without an active session; verify robot position before issuing HOME.",
                    )
                    self.get_logger().error("Robot reported at_seat without an active session; operator recovery required")
                else:
                    self.robot_status = "at_seat"
                    self.active_session_id = persisted_session_id
                    self.active_mode = "seat"
                    self.get_logger().warning(
                        f"Restored active seat assignment {persisted_session_id}; robot remains protected from new requests"
                    )
            elif persisted_status in {"going_to_seat", "returning_home"}:
                self.robot_status = "error"
                self.database.update_robot_state(
                    self.robot_id,
                    "error",
                    persisted_session_id,
                    "Bridge restarted during navigation; verify robot position before issuing HOME.",
                )
                self.get_logger().error(
                    "Bridge restarted during navigation; robot state set to error for safe operator recovery"
                )
            else:
                self.robot_status = persisted_status
        except (OSError, urllib.error.URLError, ValueError, KeyError) as error:
            self.robot_status = "error"
            self.get_logger().error(f"Could not restore persisted robot state: {error}")

    def poll_queue(self) -> None:
        if self.active_session_id is not None:
            if self.active_mode == "seat":
                if self.robot_status == "at_seat":
                    self.process_active_lifecycle()
                elif self.retry_at is not None:
                    self.process_retry_lifecycle()
                else:
                    self.process_navigation_override()
            return

        if self.robot_status == "error":
            self.process_home_command()
            return

        # HOME is an operator override when no seat goal is active. Otherwise
        # the normal path is autonomous and starts with the persistent queue.
        self.process_home_command()
        if self.active_mode is not None:
            return

        self.dispatch_next_if_available()

    def process_retry_lifecycle(self) -> None:
        """Retry an aborted seat goal while still protecting its assignment."""
        self.process_navigation_override()
        if self.active_mode != "seat" or self.retry_at is None or time.monotonic() < self.retry_at:
            return
        if not self.action_client.wait_for_server(timeout_sec=0.5):
            self.retry_at = time.monotonic() + self.retry_delay
            return
        if self.active_target is None or self.active_session_id is None:
            self.retry_at = None
            return

        self.retry_at = None
        self.robot_status = "going_to_seat"
        self.database.update_robot_state(
            self.robot_id,
            "going_to_seat",
            self.active_session_id,
            f"Retrying aborted navigation (attempt {self.retry_count + 1})",
        )
        self.get_logger().warning(
            f"Retrying session {self.active_session_id} to {self.active_target.location_code} "
            f"after Nav2 abort (attempt {self.retry_count + 1})"
        )
        self.send_navigation_goal(self.active_target)

    def process_navigation_override(self) -> None:
        """Handle only safe operator commands while a seat goal is active."""
        try:
            command = self.database.next_pending_command(self.robot_id)
            if command is None or not self.database.claim_command(command.command_id):
                return
            if command.command != "HOME":
                self.database.finish_command(
                    command.command_id,
                    "failed",
                    "NEXT is only valid after the robot reaches the seat.",
                )
                return

            if self.active_goal_handle is None:
                self.database.finish_command(command.command_id, "failed", "No active Nav2 goal to cancel")
                return

            self.pending_command_id = command.command_id
            cancel_future = self.active_goal_handle.cancel_goal_async()
            cancel_future.add_done_callback(self.navigation_cancel_callback)
            self.get_logger().warning("HOME override requested; cancelling active seat navigation")
        except (OSError, urllib.error.URLError, ValueError, KeyError) as error:
            self.get_logger().error(f"Navigation override processing failed: {error}")

    def navigation_cancel_callback(self, future) -> None:
        try:
            cancel_response = future.result()
            if not cancel_response.goals_canceling:
                raise RuntimeError("Nav2 did not cancel the active goal")
            if self.active_session_id is not None:
                self.database.update_session(self.active_session_id, "navigating", "cancelled")
            self.start_home_navigation(self.pending_command_id)
        except (OSError, urllib.error.URLError, RuntimeError, ValueError, KeyError) as error:
            self.get_logger().error(f"Could not safely execute HOME override: {error}")
            if self.pending_command_id is not None:
                try:
                    self.database.finish_command(self.pending_command_id, "failed", str(error))
                except (OSError, urllib.error.URLError) as database_error:
                    self.get_logger().error(f"Could not record failed HOME command: {database_error}")
            self.pending_command_id = None

    def dispatch_next_if_available(self) -> None:
        try:
            assignment = self.database.next_queued_assignment(self.frame_id)
            if assignment is None:
                if self.robot_status == "service_complete":
                    self.start_home_navigation(None)
                return
            if not self.action_client.wait_for_server(timeout_sec=0.5):
                self.get_logger().warning("Nav2 /navigate_to_pose is not available; leaving session queued")
                return
            if not self.database.update_session(assignment.session_id, "queued", "navigating"):
                self.get_logger().info(f"Session {assignment.session_id} was claimed by another bridge")
                return

            self.active_session_id = assignment.session_id
            self.active_target = assignment.target
            self.active_mode = "seat"
            self.robot_status = "going_to_seat"
            self.database.update_robot_state(self.robot_id, "going_to_seat", assignment.session_id)
            self.get_logger().info(
                f"Navigating session {assignment.session_id} to {assignment.target.location_code} "
                f"({assignment.target.x}, {assignment.target.y}, {assignment.target.yaw})"
            )
            self.send_navigation_goal(assignment.target)
        except (OSError, urllib.error.URLError, ValueError, KeyError) as error:
            self.get_logger().error(f"Bridge poll failed: {error}")

    def process_active_lifecycle(self) -> None:
        if self.active_mode != "seat" or self.active_session_id is None or self.robot_status != "at_seat":
            return
        try:
            # Session completion is the current HRI completion event. The
            # browser writes completed after measurements/review; a future
            # robot HRI adapter can emit the same persisted transition.
            session_status = self.database.get_session_status(self.active_session_id)
            if session_status in {"completed", "cancelled"}:
                self.complete_service_and_continue()
                return

            command = self.database.next_pending_command(self.robot_id)
            if command is None or not self.database.claim_command(command.command_id):
                return

            if command.command == "NEXT":
                # NEXT is an operator skip/release override. It uses the same
                # queue-evaluation path as normal HRI completion.
                self.database.finish_command(command.command_id, "completed")
                if session_status == "interacting":
                    self.database.update_session(self.active_session_id, "interacting", "completed")
                self.get_logger().info(f"NEXT override accepted for session {self.active_session_id}")
                self.complete_service_and_continue()
                return

            if command.command == "HOME":
                # HOME is a safety override. Preserve a completed session;
                # cancel an interaction that staff explicitly interrupted.
                if session_status == "interacting":
                    self.database.update_session(self.active_session_id, "interacting", "cancelled")
                self.start_home_navigation(command.command_id)
                return

            self.database.finish_command(command.command_id, "failed", f"Unsupported command: {command.command}")
        except (OSError, urllib.error.URLError, ValueError, KeyError) as error:
            self.get_logger().error(f"Active command processing failed: {error}")

    def complete_service_and_continue(self) -> None:
        session_id = self.active_session_id
        if session_id is None:
            return
        self.robot_status = "service_complete"
        self.database.update_robot_state(self.robot_id, "service_complete", session_id)
        self.active_session_id = None
        self.active_target = None
        self.active_mode = None
        self.active_goal_handle = None
        self.pending_command_id = None
        self.get_logger().info(f"Service complete for session {session_id}; evaluating persistent queue")
        self.dispatch_next_if_available()

    def process_home_command(self) -> None:
        try:
            command = self.database.next_pending_command(self.robot_id)
            if command is None or not self.database.claim_command(command.command_id):
                return
            if command.command != "HOME":
                self.database.finish_command(command.command_id, "failed", "HOME is the only valid command while not at a seat.")
                return
            self.start_home_navigation(command.command_id)
        except (OSError, urllib.error.URLError, ValueError, KeyError) as error:
            self.get_logger().error(f"Home command processing failed: {error}")

    def start_home_navigation(self, command_id: str | None) -> None:
        if not self.action_client.wait_for_server(timeout_sec=0.5):
            if command_id is not None:
                self.database.finish_command(command_id, "failed", "Nav2 /navigate_to_pose is not available")
            return
        home = self.database.navigation_target_for_code("HOME", self.frame_id)
        self.active_target = home
        self.active_mode = "home"
        self.robot_status = "returning_home"
        self.database.update_robot_state(self.robot_id, "returning_home", self.active_session_id)
        self.pending_command_id = command_id
        self.send_navigation_goal(home)

    def clear_active_assignment(self) -> None:
        self.active_session_id = None
        self.active_target = None
        self.active_mode = None
        self.active_goal_handle = None
        self.robot_status = "at_seat"
        self.database.update_robot_state(self.robot_id, "at_seat")

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
        self.navigation_goal_generation += 1
        goal_generation = self.navigation_goal_generation
        future = self.action_client.send_goal_async(goal)
        future.add_done_callback(lambda result: self.goal_response_callback(result, goal_generation))

    def goal_response_callback(self, future, goal_generation: int) -> None:
        if goal_generation != self.navigation_goal_generation:
            return
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
        result_future.add_done_callback(
            lambda result: self.navigation_result_callback(result, goal_generation)
        )

    def navigation_result_callback(self, future, goal_generation: int) -> None:
        if goal_generation != self.navigation_goal_generation:
            self.get_logger().info("Ignoring a stale Nav2 result from a superseded goal")
            return
        session_id = self.active_session_id
        mode = self.active_mode
        if mode is None:
            return
        try:
            action_result = future.result()
            result = action_result.status
            nav_result = getattr(action_result, "result", None)
            nav_error_code = getattr(nav_result, "error_code", None)
            nav_error_msg = getattr(nav_result, "error_msg", "")
            if result == GoalStatus.STATUS_SUCCEEDED:
                if mode == "seat" and session_id is not None:
                    self.database.update_session(session_id, "navigating", "interacting")
                    self.robot_status = "at_seat"
                    self.database.update_robot_state(self.robot_id, "at_seat", session_id)
                    hri_state = self.hri_coordinator.start(session_id)
                    self.get_logger().info(
                        f"Session {session_id} arrived; HRI state={hri_state.value}; "
                        "robot remains at seat until HRI completion, NEXT, or HOME"
                    )
                else:
                    self.robot_status = "home"
                    self.database.update_robot_state(self.robot_id, "home")
                    if self.pending_command_id is not None:
                        self.database.finish_command(self.pending_command_id, "completed")
                    self.get_logger().info("Robot reached home")
                    self.active_session_id = None
                    self.active_target = None
                    self.active_mode = None
                    self.hri_coordinator.clear()
            else:
                if mode == "seat" and session_id is not None and result == GoalStatus.STATUS_ABORTED:
                    self.retry_count += 1
                    self.retry_at = time.monotonic() + self.retry_delay
                    self.robot_status = "going_to_seat"
                    self.database.update_robot_state(
                        self.robot_id,
                        "going_to_seat",
                        session_id,
                        f"Nav2 aborted; retry scheduled (attempt {self.retry_count + 1})",
                    )
                    self.get_logger().warning(
                        f"Nav2 aborted session {session_id}; retry scheduled in {self.retry_delay:g}s"
                    )
                    return

                if mode == "seat" and session_id is not None:
                    self.database.update_session(session_id, "navigating", "cancelled")
                self.robot_status = "error"
                self.database.update_robot_state(self.robot_id, "error", session_id, f"Nav2 result {result}")
                if self.pending_command_id:
                    self.database.finish_command(self.pending_command_id, "failed", f"Nav2 result {result}")
                status_name = {
                    GoalStatus.STATUS_UNKNOWN: "UNKNOWN",
                    GoalStatus.STATUS_ACCEPTED: "ACCEPTED",
                    GoalStatus.STATUS_EXECUTING: "EXECUTING",
                    GoalStatus.STATUS_CANCELING: "CANCELING",
                    GoalStatus.STATUS_SUCCEEDED: "SUCCEEDED",
                    GoalStatus.STATUS_CANCELED: "CANCELED",
                    GoalStatus.STATUS_ABORTED: "ABORTED",
                }.get(result, "UNRECOGNIZED")
                self.get_logger().error(
                    f"Navigation ended with status {result} ({status_name}), "
                    f"Nav2 error_code={nav_error_code} error_msg={nav_error_msg!r}; "
                    "robot remains in error until HOME recovery"
                )
                self.active_session_id = None
                self.active_target = None
                self.active_mode = None
        except (OSError, urllib.error.URLError) as error:
            self.get_logger().error(f"Could not write navigation result: {error}")
        finally:
            self.active_goal_handle = None
            if mode == "seat" and self.robot_status in {"at_seat", "going_to_seat"}:
                # Keep the assignment and session active: arrival is not completion.
                pass
            else:
                self.pending_command_id = None

    def fail_active_session(self, message: str) -> None:
        self.get_logger().error(message)
        if self.active_mode == "seat" and self.active_session_id is not None:
            try:
                self.database.update_session(self.active_session_id, "navigating", "cancelled")
            except (OSError, urllib.error.URLError) as error:
                self.get_logger().error(f"Could not mark failed session cancelled: {error}")
        if self.pending_command_id is not None:
            try:
                self.database.finish_command(self.pending_command_id, "failed", message)
            except (OSError, urllib.error.URLError) as error:
                self.get_logger().error(f"Could not mark failed command: {error}")
        try:
            self.robot_status = "error"
            self.database.update_robot_state(self.robot_id, "error", self.active_session_id, message)
        except (OSError, urllib.error.URLError) as error:
            self.get_logger().error(f"Could not write robot error state: {error}")
        self.active_goal_handle = None
        self.active_session_id = None
        self.active_target = None
        self.active_mode = None
        self.hri_coordinator.clear()
        self.pending_command_id = None


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
    except KeyboardInterrupt:
        pass
    finally:
        bridge.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()


if __name__ == "__main__":
    main()
