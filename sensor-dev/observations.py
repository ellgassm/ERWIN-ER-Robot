"""Adapters that package sensor results without invoking HRI transitions."""

import time

try:
    from .interfaces import HRIObservation, ObservationType
    from .cv.gestures import GestureResult
    from .ppg.processing import HeartRateResult
except ImportError:  # Supports running this isolated directory directly.
    from interfaces import HRIObservation, ObservationType
    from cv.gestures import GestureResult
    from ppg.processing import HeartRateResult


def heart_rate_observation(result: HeartRateResult, timestamp: float | None = None) -> HRIObservation:
    return HRIObservation(ObservationType.HEART_RATE, result, time.time() if timestamp is None else timestamp)


def gesture_observation(result: GestureResult, timestamp: float | None = None) -> HRIObservation:
    return HRIObservation(ObservationType.GESTURE, result, time.time() if timestamp is None else timestamp)
