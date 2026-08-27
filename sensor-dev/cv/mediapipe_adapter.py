"""Convert MediaPipe HandLandmarker results into sensor-dev landmarks.

MediaPipe is intentionally an optional edge dependency. This module only
adapts its result shape and can be used by a Raspberry Pi camera node after
that node owns camera/model lifecycle and ROS2 publishing.
"""

from collections.abc import Iterable

try:
    from ..interfaces import HandLandmarks, Point
except ImportError:  # Supports running sensor-dev directly from its directory.
    from interfaces import HandLandmarks, Point


def hand_landmarks_from_result(result: object) -> tuple[HandLandmarks, ...]:
    """Extract up to two normalized hands from a MediaPipe result object."""
    raw_hands = getattr(result, "hand_landmarks", None) or ()
    handedness = getattr(result, "handedness", None) or ()
    converted: list[HandLandmarks] = []
    for index, raw_hand in enumerate(tuple(raw_hands)[:2]):
        points = tuple(Point(float(point.x), float(point.y)) for point in raw_hand)
        label = None
        if index < len(handedness) and handedness[index]:
            label = getattr(handedness[index][0], "category_name", None)
        if len(points) == 21:
            converted.append(HandLandmarks(points, label))
    return tuple(converted)


class MediaPipeCameraSource:
    """Adapt an injected MediaPipe result iterable to the camera contract."""

    def __init__(self, results: Iterable[object]):
        self.results = results

    def landmarks(self) -> Iterable[tuple[HandLandmarks, ...]]:
        for result in self.results:
            yield hand_landmarks_from_result(result)
