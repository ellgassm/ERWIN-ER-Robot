"""Input/output contracts for isolated sensor development."""

from dataclasses import dataclass
from enum import Enum
from typing import Iterable, Protocol


@dataclass(frozen=True)
class PPGSample:
    timestamp: float
    value: float


class RawPPGSource(Protocol):
    def samples(self) -> Iterable[PPGSample]:
        """Yield timestamped raw samples from an Arduino adapter or simulator."""


@dataclass(frozen=True)
class Point:
    x: float
    y: float


@dataclass(frozen=True)
class HandLandmarks:
    """Normalized MediaPipe-like hand landmarks, indexed 0 through 20."""

    points: tuple[Point, ...]
    handedness: str | None = None


class ObservationType(str, Enum):
    HEART_RATE = "heart_rate"
    GESTURE = "gesture"


@dataclass(frozen=True)
class HRIObservation:
    """Neutral observation contract for a future HRI controller."""

    type: ObservationType
    value: object
    timestamp: float
