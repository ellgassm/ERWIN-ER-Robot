#!/usr/bin/env python3
"""Support-PC MediaPipe node for ERWIN hand gestures.

Subscribes to sensor_msgs/Image from the Raspberry Pi and publishes the small
JSON event contract consumed by the robot bridge. This process owns camera
inference; it does not own HRI transitions or navigation.
"""

import json
import os
import sys
import time
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from std_msgs.msg import String
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

SENSOR_DEV = Path(__file__).resolve().parents[2] / "sensor-dev"
sys.path.insert(0, str(SENSOR_DEV))

from cv.gestures import Gesture, GestureClassifier, TemporalGestureConfirmer, TwoHandPainCounter  # noqa: E402
from cv.mediapipe_adapter import hand_landmarks_from_result  # noqa: E402


class MediaPipeGestureNode(Node):
    def __init__(self) -> None:
        super().__init__("erwin_mediapipe_gesture")
        model_path = os.getenv("ERWIN_HAND_MODEL", str(Path.home() / "erwin-models/hand_landmarker.task"))
        image_topic = os.getenv("ERWIN_IMAGE_TOPIC", "/image_raw")
        gesture_topic = os.getenv("ERWIN_GESTURE_TOPIC", "/erwin/hri/gesture")
        pain_topic = os.getenv("ERWIN_PAIN_FINGERS_TOPIC", "/erwin/hri/pain_fingers")
        if not Path(model_path).is_file():
            raise FileNotFoundError(f"Hand-landmarker model not found: {model_path}")

        options = vision.HandLandmarkerOptions(
            base_options=python.BaseOptions(model_asset_path=model_path),
            running_mode=vision.RunningMode.VIDEO,
            num_hands=2,
            min_hand_detection_confidence=0.5,
            min_hand_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.detector = vision.HandLandmarker.create_from_options(options)
        self.classifier = GestureClassifier()
        self.confirmer = TemporalGestureConfirmer()
        self.pain_counter = TwoHandPainCounter(self.classifier)
        self.last_pain_count: int | None = None
        self.pain_stable_frames = 0
        self.gesture_publisher = self.create_publisher(String, gesture_topic, 10)
        self.pain_publisher = self.create_publisher(String, pain_topic, 10)
        self.subscription = self.create_subscription(Image, image_topic, self.on_image, 10)
        self.get_logger().info(f"MediaPipe ready: image={image_topic} hands=2 model={model_path}")

    def on_image(self, message: Image) -> None:
        try:
            frame = self.decode_image(message)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = self.detector.detect_for_video(
                mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb),
                time.monotonic_ns() // 1_000_000,
            )
            hands = hand_landmarks_from_result(result)
            self.publish_gesture(hands)
            self.publish_pain_count(hands)
        except Exception as error:  # noqa: BLE001 - camera/MediaPipe errors are runtime-dependent
            self.get_logger().warning(f"Could not process camera frame: {error}")

    @staticmethod
    def decode_image(message: Image) -> np.ndarray:
        """Decode common ROS camera encodings without cv_bridge."""
        encoding = message.encoding.lower()
        channels = {"mono8": 1, "bgr8": 3, "rgb8": 3, "bgra8": 4, "rgba8": 4}.get(encoding)
        if channels is None:
            raise ValueError(f"unsupported camera encoding: {message.encoding}")
        array = np.frombuffer(message.data, dtype=np.uint8)
        expected = message.height * message.step
        if array.size < expected:
            raise ValueError("camera message data is shorter than its declared step")
        array = array[:expected].reshape((message.height, message.step))
        array = array[:, : message.width * channels].reshape((message.height, message.width, channels))
        if encoding == "rgb8":
            return cv2.cvtColor(array, cv2.COLOR_RGB2BGR)
        if encoding == "rgba8":
            return cv2.cvtColor(array, cv2.COLOR_RGBA2BGR)
        if encoding == "bgra8":
            return cv2.cvtColor(array, cv2.COLOR_BGRA2BGR)
        if encoding == "mono8":
            return cv2.cvtColor(array, cv2.COLOR_GRAY2BGR)
        return array

    def publish_gesture(self, hands) -> None:
        if not hands:
            self.confirmer.update(self.classifier.classify(None))
            return
        results = [self.classifier.classify(hand) for hand in hands]
        actionable = [
            result
            for result in results
            if result.gesture not in {Gesture.UNKNOWN, Gesture.NO_HAND_DETECTED}
        ]
        names = {result.gesture for result in actionable}
        # A partially detected second hand should not suppress a clear
        # one-hand task/confirmation gesture. Two conflicting actionable
        # gestures remain ambiguous and are rejected.
        if len(names) != 1:
            self.confirmer.update(self.classifier.classify(None))
            return
        confirmed = self.confirmer.update(actionable[0])
        if not confirmed.confirmed:
            return
        message = String()
        message.data = json.dumps({
            "gesture": confirmed.gesture.value,
            "confirmed": True,
            "confidence": confirmed.confidence,
        })
        self.gesture_publisher.publish(message)

    def publish_pain_count(self, hands) -> None:
        if not hands:
            self.last_pain_count = None
            self.pain_stable_frames = 0
            return
        result = self.pain_counter.count(hands)
        if result.count == self.last_pain_count:
            self.pain_stable_frames += 1
        else:
            self.last_pain_count = result.count
            self.pain_stable_frames = 1
        if self.pain_stable_frames < 3 or result.confidence < 0.65:
            return
        message = String()
        message.data = json.dumps({"value": result.count, "confidence": result.confidence})
        self.pain_publisher.publish(message)

    def destroy_node(self):
        self.detector.close()
        return super().destroy_node()


def main() -> None:
    rclpy.init()
    node = MediaPipeGestureNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()


if __name__ == "__main__":
    main()
