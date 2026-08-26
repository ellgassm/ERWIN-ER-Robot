# ERWIN robot bridge

This is the support-PC process that connects Supabase application state to the physical TurtleBot3/Nav2 system. It is not a mock robot and it does not expose ROS2 to the browser.

## Verified environment

The supplied support-PC inspection reported ROS 2 Jazzy, `ROS_DOMAIN_ID=2`, `TURTLEBOT3_MODEL=burger`, an active `/navigate_to_pose` action, `/scan`, `/odom`, and `/tf`, with no namespace shown.

The bridge uses the standard `nav2_msgs/action/NavigateToPose` interface and the `map` frame by default. Set `ERWIN_NAVIGATION_FRAME` only if the live system confirms a different frame.

## Configuration

Set these variables on the support PC only:

```bash
export SUPABASE_URL="https://<project>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<server-only-key>"
export ERWIN_NAVIGATION_FRAME="map"
export ERWIN_POLL_INTERVAL_SECONDS="2"
export ROBOT_ID="erwin-1"
export ERWIN_HOME_X="-0.02098032273352146"
export ERWIN_HOME_Y="-0.028868287801742554"
export ERWIN_HOME_YAW="0"
```

The bridge reads `x`, `y`, and `yaw` from the session's `waiting_locations` row. It never contains seat coordinates. The observed navigation test indicates that this map's positive X axis points north and positive Y points west. Therefore `SEAT1` and `SEAT2` use the `map` frame and a west-facing yaw of `1.5707963267948966` radians, while the north-facing HOME pose uses yaw `0`.

The reported docked home pose is `(-0.02098032273352146, -0.028868287801742554)` in the `map` frame. Its north-facing yaw is `0` radians under the observed axis convention. This is recorded as robot configuration, not as a patient waiting location. The bridge uses these values for the explicit `HOME` command and allows them to be overridden with environment variables.

## Run

```bash
source /opt/ros/jazzy/setup.bash
source /home/user/turtlebot3_ws/install/setup.bash
export TURTLEBOT3_MODEL=burger
export ROS_DOMAIN_ID=2
python3 /home/user/ERWIN/robot/bridge/erwin_robot_bridge.py
```

Before running with a real robot, verify Nav2 and the map/localization stack are already active and confirm the database coordinates are safe for the loaded map. The bridge marks a session `navigating` only after the Nav2 action server is available, and marks it `interacting` only after Nav2 reports success. At that point it persists robot state `at_seat` and holds the assignment. When the existing HRI flow marks the session `completed`, the bridge persists `service_complete`, evaluates the FIFO queue, and autonomously navigates to the next request or home if the queue is empty.

For optional demo overrides, open `/operator`. `NEXT` skips/releases the active service and invokes the normal queue evaluation; `HOME` returns to base. These commands are not required for normal autonomous operation. The screen is intentionally unauthenticated for the hackathon prototype and must not be exposed to real patient data.
