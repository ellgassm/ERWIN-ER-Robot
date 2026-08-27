"""Translate sensor-domain results into semantic HRI events.

This module deliberately accepts result-shaped objects instead of importing
MediaPipe, OpenCV, Arduino, or ROS2 types. Hardware adapters can therefore run
on the Raspberry Pi and feed this boundary through a future ROS2 transport.
"""

from dataclasses import dataclass
from typing import Any

from .coordinator import HriCoordinator
from .hri_state_machine import HriState


@dataclass(frozen=True)
class SensorEventAdapter:
    """State-aware adapter for confirmed CV, PPG, phone, and finger input."""

    coordinator: HriCoordinator
    minimum_confidence: float = 0.65

    def gesture(self, result: Any) -> HriState | None:
        """Handle only a confirmed, sufficiently confident gesture result."""
        if not getattr(result, "confirmed", False):
            return None
        if float(getattr(result, "confidence", 0.0)) < self.minimum_confidence:
            return None
        gesture = getattr(result, "gesture", None)
        value = getattr(gesture, "value", gesture)
        return self.coordinator.handle_gesture(str(value))

    def pain_finger_count(self, result: Any) -> HriState:
        """Submit a stable 0–10 two-hand finger count as pain input."""
        if self.coordinator.state != HriState.PAIN_INPUT:
            raise ValueError("finger-count pain input is only valid during pain input")
        count = int(getattr(result, "count", -1))
        confidence = float(getattr(result, "confidence", 0.0))
        if not 0 <= count <= 10 or confidence < self.minimum_confidence:
            raise ValueError("pain finger count is not a stable 0-10 observation")
        return self.coordinator.handle_pain(count)

    def ppg_attached(self) -> HriState:
        return self.coordinator.handle_ppg_attached()

    def heart_rate(self, result: Any) -> HriState | None:
        """Advance only from a valid, confident HeartRateResult."""
        if not getattr(result, "valid", False):
            return None
        if float(getattr(result, "confidence", 0.0)) < self.minimum_confidence:
            return None
        bpm = getattr(result, "bpm", None)
        if bpm is None:
            return None
        return self.coordinator.handle_heart_rate(float(bpm))

