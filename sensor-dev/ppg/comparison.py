"""Configurable prototype baseline comparison."""

from dataclasses import dataclass
from enum import Enum

try:
    from .processing import HeartRateResult
except ImportError:  # Supports running this isolated directory directly.
    from processing import HeartRateResult


class BaselineClassification(str, Enum):
    NORMAL = "NORMAL"
    ELEVATED = "ELEVATED"
    CONCERNING = "CONCERNING"
    INVALID_MEASUREMENT = "INVALID_MEASUREMENT"


@dataclass(frozen=True)
class BaselineThresholds:
    elevated_absolute_delta: float = 15.0
    elevated_relative_delta: float = 0.15
    concerning_absolute_delta: float = 25.0
    concerning_relative_delta: float = 0.25


@dataclass(frozen=True)
class BaselineComparison:
    baseline_bpm: float
    current_bpm: float | None
    absolute_delta: float | None
    relative_delta: float | None
    classification: BaselineClassification
    reason: str


def compare_to_baseline(
    baseline_bpm: float,
    result: HeartRateResult,
    thresholds: BaselineThresholds | None = None,
) -> BaselineComparison:
    if baseline_bpm <= 0:
        raise ValueError("baseline_bpm must be positive")
    config = thresholds or BaselineThresholds()
    if not result.valid or result.bpm is None:
        return BaselineComparison(baseline_bpm, result.bpm, None, None, BaselineClassification.INVALID_MEASUREMENT, "measurement is not reliable")
    absolute = result.bpm - baseline_bpm
    relative = absolute / baseline_bpm
    magnitude = abs(absolute)
    relative_magnitude = abs(relative)
    if magnitude >= config.concerning_absolute_delta or relative_magnitude >= config.concerning_relative_delta:
        classification = BaselineClassification.CONCERNING
    elif magnitude >= config.elevated_absolute_delta or relative_magnitude >= config.elevated_relative_delta:
        classification = BaselineClassification.ELEVATED
    else:
        classification = BaselineClassification.NORMAL
    return BaselineComparison(baseline_bpm, result.bpm, round(absolute, 1), round(relative, 3), classification, "prototype threshold comparison")
