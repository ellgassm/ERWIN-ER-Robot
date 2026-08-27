# ERWIN robot bridge

This is the support-PC process that connects Supabase application state to the physical TurtleBot3/Nav2 system. It is not a mock robot and it does not expose ROS2 to the browser.

## Verified environment

The supplied support-PC inspection reported ROS 2 Jazzy, `ROS_DOMAIN_ID=2`, `TURTLEBOT3_MODEL=burger`, an active `/navigate_to_pose` action, `/scan`, `/odom`, and `/tf`, with no namespace shown.

The bridge uses the standard `nav2_msgs/action/NavigateToPose` interface and the `map` frame by default. Set `ERWIN_NAVIGATION_FRAME` only if the live system confirms a different frame.

## Configuration

Set these variables on the support PC only:

```bash
export SUPABASE_URL="https://<project>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<server-only-key-or-sb_secret-key>"
export ERWIN_NAVIGATION_FRAME="map"
export ERWIN_POLL_INTERVAL_SECONDS="2"
export ERWIN_RETRY_DELAY_SECONDS="5"
export ROBOT_ID="erwin-1"
```

For a new Supabase `sb_secret_...` key, the bridge sends it through the
`apikey` header only. Legacy JWT `service_role` keys continue to use the
Bearer header for compatibility.

The bridge reads `x`, `y`, and `yaw` from the session's `waiting_locations` row. It never contains seat coordinates. The observed navigation test indicates that this map's positive X axis points north and positive Y points west. Therefore `SEAT1` and `SEAT2` use the `map` frame and a west-facing yaw of `1.5707963267948966` radians, while the north-facing HOME pose uses yaw `0`.

The reported docked home pose is `(-0.02098032273352146, -0.028868287801742554)` in the `map` frame. Its north-facing yaw is `0` radians under the observed axis convention. This is represented by the `HOME` row in `waiting_locations`, and the bridge resolves that row for return navigation. The bridge does not use hardcoded home coordinates.

## Run

```bash
source /opt/ros/jazzy/setup.bash
source /home/user/turtlebot3_ws/install/setup.bash
export TURTLEBOT3_MODEL=burger
export ROS_DOMAIN_ID=2
python3 /home/user/ERWIN/robot/bridge/erwin_robot_bridge.py
```

Before running with a real robot, verify Nav2 and the map/localization stack are already active and confirm the database coordinates are safe for the loaded map. The bridge marks a session `navigating` only after the Nav2 action server is available, and marks it `interacting` only after Nav2 reports success. If Nav2 returns `STATUS_ABORTED`, the bridge retains the assignment and resends the same goal after `ERWIN_RETRY_DELAY_SECONDS`; it does not mark the patient session cancelled. At arrival it persists robot state `at_seat` and holds the assignment. When the existing HRI flow marks the session `completed`, the bridge persists `service_complete`, evaluates the FIFO queue, and autonomously navigates to the next request or the database-backed `HOME` row if the queue is empty. A HOME override during seat navigation first cancels the active Nav2 goal and cancels the associated session before returning home.

For optional demo overrides, open `/operator`. `NEXT` skips/releases the active service and invokes the normal queue evaluation; `HOME` returns to base. These commands are not required for normal autonomous operation. The screen is intentionally unauthenticated for the hackathon prototype and must not be exposed to real patient data.

## HRI boundary

After confirmed seat arrival, the bridge initializes the UI-independent HRI
state machine in `hri/hri_state_machine.py` and logs its initial
`select_assistance` state. The state machine exposes domain events and the
`hri/ports.py` display/input protocols; it does not import ROS2 or React.
There is no physical display adapter in this checkpoint yet, so the existing
phone interaction remains the active completion path. The HRI state machine
must not be treated as complete until a real display/input adapter is wired to
it.
