"""PPG acquisition, processing, and evaluation."""

from .processing import HeartRateConfig, HeartRateProcessor, HeartRateResult
from .simulator import SimulatedPPGSource

__all__ = ["HeartRateConfig", "HeartRateProcessor", "HeartRateResult", "SimulatedPPGSource"]
