"""Lightweight landmark-based gesture recognition.

The classifier consumes normalized hand landmarks, not camera frames. A future
MediaPipe/OpenCV or Raspberry Pi adapter can provide landmarks without changing
this deterministic classification layer.
"""

from dataclasses import dataclass, replace
from enum import Enum
import math
import time

try:
    from ..interfaces import HandLandmarks, Point
except ImportError:  # Supports running this isolated directory directly.
    from interfaces import HandLandmarks, Point


class Gesture(str, Enum):
    ONE = "ONE"
    TWO = "TWO"
    THREE = "THREE"
    FOUR = "FOUR"
    FIVE = "FIVE"
    THUMBS_UP = "THUMBS_UP"
    THUMBS_DOWN = "THUMBS_DOWN"
    UNKNOWN = "UNKNOWN"
    NO_HAND_DETECTED = "NO_HAND_DETECTED"


@dataclass(frozen=True)
class GestureResult:
    gesture: Gesture
    confidence: float
    timestamp: float
    stable_frames: int = 1
    confirmed: bool = False


@dataclass(frozen=True)
class FingerCountResult:
    """Stable-ready finger count for pain input across one or two hands."""

    count: int
    confidence: float
    timestamp: float


def _distance(a: Point, b: Point) -> float:
    return math.hypot(a.x - b.x, a.y - b.y)


class GestureClassifier:
    """Classify deliberate gestures from 21 normalized hand landmarks."""

    _tips = (8, 12, 16, 20)
    _pips = (6, 10, 14, 18)

    def classify(self, landmarks: HandLandmarks | None, timestamp: float | None = None) -> GestureResult:
        now = time.time() if timestamp is None else timestamp
        if landmarks is None:
            return GestureResult(Gesture.NO_HAND_DETECTED, 1.0, now)
        if len(landmarks.points) != 21:
            return GestureResult(Gesture.UNKNOWN, 0.0, now)
        points = landmarks.points
        wrist = points[0]
        extended = [self._is_extended(points, tip, pip, wrist) for tip, pip in zip(self._tips, self._pips)]
        curled = sum(not value for value in extended)
        thumb_up = points[4].y < points[2].y - 0.08 and curled >= 3
        thumb_down = points[4].y > points[2].y + 0.08 and curled >= 3
        if thumb_up or thumb_down:
            margin = abs(points[4].y - points[2].y)
            confidence = min(1.0, 0.65 + margin)
            return GestureResult(Gesture.THUMBS_UP if thumb_up else Gesture.THUMBS_DOWN, confidence, now)
        count = sum(extended)
        gestures = {1: Gesture.ONE, 2: Gesture.TWO, 3: Gesture.THREE, 4: Gesture.FOUR, 5: Gesture.FIVE}
        if count == 0:
            return GestureResult(Gesture.UNKNOWN, 0.55, now)
        confidence = min(1.0, 0.6 + 0.1 * count)
        return GestureResult(gestures[count], confidence, now)

    def count_fingers(self, landmarks: HandLandmarks | None) -> tuple[int, float]:
        """Return a best-effort 0–5 count for a single MediaPipe hand.

        Task-choice and confirmation gestures continue to use ``classify``.
        This separate method exists because pain input needs the thumb as well
        as the four finger landmarks and may combine two hands.
        """
        if landmarks is None or len(landmarks.points) != 21:
            return 0, 0.0
        points = landmarks.points
        extended = [self._is_extended(points, tip, pip, points[0]) for tip, pip in zip(self._tips, self._pips)]
        thumb = self._thumb_is_extended(points, landmarks.handedness)
        count = sum(extended) + int(thumb)
        return count, 0.7 if count in range(6) else 0.0

    @staticmethod
    def _is_extended(points: tuple[Point, ...], tip_index: int, pip_index: int, wrist: Point) -> bool:
        tip = points[tip_index]
        pip = points[pip_index]
        return tip.y < pip.y - 0.025 and _distance(tip, wrist) > _distance(pip, wrist) * 1.02

    @staticmethod
    def _thumb_is_extended(points: tuple[Point, ...], handedness: str | None) -> bool:
        # Handedness is useful metadata, but a distance/scale test is more
        # stable than a fixed image-axis test when the hand rotates. Use the
        # wrist-to-middle-MCP distance as the person's hand scale.
        mcp, ip, tip, index_mcp, middle_mcp = points[2], points[3], points[4], points[5], points[9]
        palm_scale = _distance(points[0], middle_mcp)
        if palm_scale <= 0:
            return False
        reach = _distance(tip, points[0])
        joint_reach = _distance(ip, points[0])
        lateral_reach = _distance(tip, index_mcp)
        # The handedness argument remains part of the contract for future
        # handedness-specific tuning; the geometry works for either hand and
        # for mirrored camera images.
        _ = handedness
        v1 = (mcp.x - ip.x, mcp.y - ip.y)
        v2 = (tip.x - ip.x, tip.y - ip.y)
        denominator = math.hypot(*v1) * math.hypot(*v2)
        if denominator == 0:
            return False
        joint_angle = math.degrees(math.acos(max(-1.0, min(1.0, (v1[0] * v2[0] + v1[1] * v2[1]) / denominator))))
        return (
            reach > joint_reach * 1.01
            and lateral_reach > palm_scale * 0.18
            and joint_angle > 80.0
        )


class TwoHandPainCounter:
    """Count raised fingers from up to two hands, yielding a 0–10 value."""

    def __init__(self, classifier: GestureClassifier | None = None) -> None:
        self.classifier = classifier or GestureClassifier()

    def count(self, hands: tuple[HandLandmarks, ...] | list[HandLandmarks], timestamp: float | None = None) -> FingerCountResult:
        now = time.time() if timestamp is None else timestamp
        selected = tuple(hands[:2])
        if not selected:
            return FingerCountResult(0, 0.0, now)
        counts = [self.classifier.count_fingers(hand) for hand in selected]
        return FingerCountResult(
            count=min(10, sum(item[0] for item in counts)),
            confidence=min(item[1] for item in counts),
            timestamp=now,
        )

class TemporalGestureConfirmer:
    """Require the same actionable gesture across consecutive observations."""

    def __init__(self, required_frames: int = 3, minimum_confidence: float = 0.65) -> None:
        if required_frames < 1:
            raise ValueError("required_frames must be positive")
        self.required_frames = required_frames
        self.minimum_confidence = minimum_confidence
        self._last_gesture: Gesture | None = None
        self._stable_frames = 0

    def update(self, result: GestureResult) -> GestureResult:
        actionable = result.gesture not in {Gesture.UNKNOWN, Gesture.NO_HAND_DETECTED} and result.confidence >= self.minimum_confidence
        if not actionable:
            self._last_gesture = None
            self._stable_frames = 0
            return replace(result, stable_frames=0, confirmed=False)
        if result.gesture == self._last_gesture:
            self._stable_frames += 1
        else:
            self._last_gesture = result.gesture
            self._stable_frames = 1
        return replace(result, stable_frames=self._stable_frames, confirmed=self._stable_frames >= self.required_frames)
