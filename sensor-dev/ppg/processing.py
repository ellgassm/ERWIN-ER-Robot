"""Prototype PPG preprocessing, peak detection, and quality scoring."""

from dataclasses import dataclass
from datetime import datetime, timezone
import math
from statistics import mean, median, pstdev
from typing import Iterable

try:
    from ..interfaces import PPGSample
except ImportError:  # Supports running this isolated directory directly.
    from interfaces import PPGSample


@dataclass(frozen=True)
class HeartRateConfig:
    min_bpm: float = 40.0
    max_bpm: float = 180.0
    min_duration_seconds: float = 8.0
    smoothing_window_seconds: float = 0.08
    baseline_window_seconds: float = 0.75
    minimum_peak_prominence: float = 0.08
    minimum_confidence: float = 0.55


@dataclass(frozen=True)
class HeartRateResult:
    bpm: float | None
    confidence: float
    signal_quality: float
    sample_count: int
    duration_seconds: float
    timestamp: str
    valid: bool
    reason: str | None = None


def _moving_average(values: list[float], window: int) -> list[float]:
    if window <= 1:
        return values[:]
    output: list[float] = []
    running = 0.0
    for index, value in enumerate(values):
        running += value
        if index >= window:
            running -= values[index - window]
        output.append(running / min(index + 1, window))
    return output


class HeartRateProcessor:
    """Estimate heart rate from raw timestamped PPG samples.

    This is an assistive screening prototype, not a clinical diagnostic
    algorithm. The result exposes quality/confidence so callers can reject
    noisy readings instead of treating every BPM estimate as trustworthy.
    """

    def __init__(self, config: HeartRateConfig | None = None) -> None:
        self.config = config or HeartRateConfig()

    def process(self, samples: Iterable[PPGSample]) -> HeartRateResult:
        ordered = list(samples)
        now = datetime.now(timezone.utc).isoformat()
        if len(ordered) < 3:
            return self._invalid(ordered, now, "not enough samples")
        duration = ordered[-1].timestamp - ordered[0].timestamp
        if duration < self.config.min_duration_seconds:
            return self._invalid(ordered, now, "recording is shorter than the minimum duration")
        intervals = [ordered[i].timestamp - ordered[i - 1].timestamp for i in range(1, len(ordered))]
        sample_rate = 1.0 / median(intervals) if intervals and median(intervals) > 0 else 0.0
        if sample_rate <= 0:
            return self._invalid(ordered, now, "invalid sample timestamps")

        raw = [sample.value for sample in ordered]
        centered = [value - mean(raw) for value in raw]
        smooth = _moving_average(centered, max(1, round(sample_rate * self.config.smoothing_window_seconds)))
        baseline = _moving_average(smooth, max(1, round(sample_rate * self.config.baseline_window_seconds)))
        waveform = [value - base for value, base in zip(smooth, baseline)]
        peaks = self._find_peaks(waveform, sample_rate)
        beat_intervals = [ordered[b].timestamp - ordered[a].timestamp for a, b in zip(peaks, peaks[1:])]
        plausible = [interval for interval in beat_intervals if 60.0 / self.config.max_bpm <= interval <= 60.0 / self.config.min_bpm]
        if len(plausible) < 2:
            return self._invalid(ordered, now, "fewer than two plausible inter-beat intervals", duration)

        bpm = 60.0 / median(plausible)
        interval_variation = pstdev(plausible) / mean(plausible) if len(plausible) > 1 else 1.0
        consistency = max(0.0, min(1.0, 1.0 - interval_variation * 4.0))
        amplitude = pstdev(waveform)
        raw_noise = pstdev([raw[i] - smooth[i] for i in range(len(raw))]) or 1e-9
        amplitude_score = max(0.0, min(1.0, amplitude / (amplitude + raw_noise * 3.0)))
        coverage = min(1.0, len(plausible) / max(1.0, duration * bpm / 60.0 * 0.5))
        confidence = max(0.0, min(1.0, 0.45 * consistency + 0.4 * amplitude_score + 0.15 * coverage))
        quality = round(confidence * 100.0, 1)
        if confidence < self.config.minimum_confidence:
            return HeartRateResult(bpm, confidence, quality, len(ordered), duration, now, False, "signal quality is too low")
        return HeartRateResult(round(bpm, 1), confidence, quality, len(ordered), duration, now, True)

    def _find_peaks(self, waveform: list[float], sample_rate: float) -> list[int]:
        minimum_distance = max(1, round(sample_rate * 60.0 / self.config.max_bpm))
        neighborhood = max(1, round(sample_rate * 0.15))
        peaks: list[int] = []
        for index in range(1, len(waveform) - 1):
            if waveform[index] <= waveform[index - 1] or waveform[index] < waveform[index + 1]:
                continue
            left = min(waveform[max(0, index - neighborhood):index])
            right = min(waveform[index + 1:min(len(waveform), index + neighborhood + 1)])
            if waveform[index] - max(left, right) < self.config.minimum_peak_prominence:
                continue
            if peaks and index - peaks[-1] < minimum_distance:
                if waveform[index] > waveform[peaks[-1]]:
                    peaks[-1] = index
                continue
            peaks.append(index)
        return peaks

    @staticmethod
    def _invalid(samples: list[PPGSample], timestamp: str, reason: str, duration: float | None = None) -> HeartRateResult:
        actual_duration = duration if duration is not None else (samples[-1].timestamp - samples[0].timestamp if len(samples) > 1 else 0.0)
        return HeartRateResult(None, 0.0, 0.0, len(samples), actual_duration, timestamp, False, reason)
