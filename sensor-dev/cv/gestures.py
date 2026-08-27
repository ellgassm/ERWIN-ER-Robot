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

    @staticmethod
    def _is_extended(points: tuple[Point, ...], tip_index: int, pip_index: int, wrist: Point) -> bool:
        tip = points[tip_index]
        pip = points[pip_index]
        return tip.y < pip.y - 0.025 and _distance(tip, wrist) > _distance(pip, wrist) * 1.02


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
