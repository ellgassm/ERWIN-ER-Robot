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
export ERWIN_DISPLAY_TOPIC="/erwin/display_state"
export ROBOT_ID="erwin-1"
```

For a new Supabase `sb_secret_...` key, the bridge sends it through the
`apikey` header only. Legacy JWT `service_role` keys continue to use the
Bearer header for compatibility.

The bridge reads `x`, `y`, and `yaw` from the session's `waiting_locations` row. It never contains seat coordinates. The observed navigation test indicates that this map's positive X axis points north and positive Y points west. Therefore `SEAT1` and `SEAT2` use the `map` frame and a west-facing yaw of `1.5707963267948966` radians, while the north-facing HOME pose uses yaw `0`.

## HRI sensor event transport

The bridge subscribes to these `std_msgs/msg/String` topics. Each message is a
JSON object; sensor nodes do not need to import the HRI state-machine package.

```text
/erwin/hri/gesture       {"gesture":"ONE","confirmed":true,"confidence":0.9,"session_id":"..."}
/erwin/hri/ppg_attached  {"attached":true,"session_id":"..."}
/erwin/hri/heart_rate    {"bpm":72,"valid":true,"confidence":0.9,"session_id":"..."}
/erwin/hri/pain          {"value":4,"session_id":"..."}
```

The topic names are configurable with `ERWIN_GESTURE_TOPIC`,
`ERWIN_PPG_ATTACHED_TOPIC`, `ERWIN_HEART_RATE_TOPIC`, and `ERWIN_PAIN_TOPIC`.
Events with a non-matching `session_id` are ignored. Gesture events must be
confirmed, PPG results must be valid, and heart-rate confidence must meet the
bridge threshold. The bridge accepts phone pain through the same semantic pain
event path when a future phone/backend adapter publishes it.

The support-PC MediaPipe node is `robot/sensors/mediapipe_gesture_node.py`.
It subscribes to `/image_raw`, detects up to two hands, publishes confirmed
gestures on `/erwin/hri/gesture`, and publishes stable two-hand pain counts on
`/erwin/hri/pain_fingers`. Run it from the repository root with the MediaPipe
virtual environment active:

```bash
source "$HOME/erwin-vision-venv/bin/activate"
source /opt/ros/jazzy/setup.bash
export ROS_DOMAIN_ID=2
export ROS_LOCALHOST_ONLY=0
python3 robot/sensors/mediapipe_gesture_node.py
```

The Pi camera publisher and the support-PC MediaPipe node must use the same
ROS domain. The MediaPipe node does not publish navigation commands.

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
phone interaction remains the active completion path. The bridge now publishes
display-only JSON messages as `std_msgs/msg/String` on
`/erwin/display_state`; the touchscreen package subscribes through rosbridge.
The display remains output-only. The sensor event subscriptions are now wired
at the bridge boundary; actual MediaPipe camera and Arduino/PPG device nodes
remain hardware-specific follow-up work.
