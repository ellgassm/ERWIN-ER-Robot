"""Deterministic raw PPG simulator for development without an Arduino."""

from dataclasses import dataclass
import math
import random

try:
    from ..interfaces import PPGSample
except ImportError:  # Supports running this isolated directory directly.
    from interfaces import PPGSample


@dataclass
class SimulatedPPGSource:
    bpm: float = 72.0
    sample_rate_hz: float = 100.0
    duration_seconds: float = 15.0
    noise_amplitude: float = 0.02
    pulse_amplitude: float = 1.0
    motion_artifact: float = 0.0
    seed: int = 7

    def samples(self):
        if self.bpm <= 0 or self.sample_rate_hz <= 0 or self.duration_seconds <= 0:
            return
        rng = random.Random(self.seed)
        count = int(self.duration_seconds * self.sample_rate_hz)
        frequency = self.bpm / 60.0
        for index in range(count):
            timestamp = index / self.sample_rate_hz
            phase = 2.0 * math.pi * frequency * timestamp
            # A sine plus its second harmonic resembles a simple pulse wave.
            pulse = math.sin(phase) + 0.25 * math.sin(2.0 * phase)
            noise = rng.uniform(-self.noise_amplitude, self.noise_amplitude)
            artifact = self.motion_artifact * math.sin(2.0 * math.pi * 0.7 * timestamp)
            yield PPGSample(timestamp, self.pulse_amplitude * pulse + noise + artifact)
