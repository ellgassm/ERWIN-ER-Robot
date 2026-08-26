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
```

The bridge reads `x`, `y`, and `yaw` from the session's `waiting_locations` row. It never contains seat coordinates. For the current SLAM targets, `SEAT1` and `SEAT2` use the `map` frame and a west-facing yaw of `3.141592653589793` radians. This assumes the map's positive x-axis is east; verify that convention with the SLAM team before physical movement.

## Run

```bash
source /opt/ros/jazzy/setup.bash
source /home/user/turtlebot3_ws/install/setup.bash
export TURTLEBOT3_MODEL=burger
export ROS_DOMAIN_ID=2
python3 /home/user/ERWIN/robot/bridge/erwin_robot_bridge.py
```

Before running with a real robot, verify Nav2 and the map/localization stack are already active and confirm the database coordinates are safe for the loaded map. The bridge marks a session `navigating` only after the Nav2 action server is available, and marks it `interacting` only after Nav2 reports success.
