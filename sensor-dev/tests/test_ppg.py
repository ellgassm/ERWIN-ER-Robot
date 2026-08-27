import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ppg.processing import HeartRateProcessor
from ppg.simulator import SimulatedPPGSource
from ppg.comparison import BaselineClassification, compare_to_baseline


class PPGTests(unittest.TestCase):
    def test_clean_synthetic_pulse_estimates_bpm(self):
        result = HeartRateProcessor().process(SimulatedPPGSource(bpm=72).samples())
        self.assertTrue(result.valid, result.reason)
        self.assertAlmostEqual(result.bpm, 72, delta=3)
        self.assertGreater(result.signal_quality, 50)

    def test_short_recording_is_rejected(self):
        result = HeartRateProcessor().process(SimulatedPPGSource(duration_seconds=2).samples())
        self.assertFalse(result.valid)
        self.assertIsNone(result.bpm)

    def test_noisy_recording_exposes_quality(self):
        result = HeartRateProcessor().process(SimulatedPPGSource(noise_amplitude=1.5).samples())
        self.assertLess(result.confidence, 0.8)

    def test_high_and_low_rates_are_supported(self):
        processor = HeartRateProcessor()
        high = processor.process(SimulatedPPGSource(bpm=150).samples())
        low = processor.process(SimulatedPPGSource(bpm=45).samples())
        self.assertTrue(high.valid)
        self.assertTrue(low.valid)
        self.assertAlmostEqual(high.bpm, 150, delta=4)
        self.assertAlmostEqual(low.bpm, 45, delta=4)

    def test_weak_and_motion_corrupted_signals_are_not_trusted(self):
        processor = HeartRateProcessor()
        weak = processor.process(SimulatedPPGSource(pulse_amplitude=0.05, noise_amplitude=0.05).samples())
        motion = processor.process(SimulatedPPGSource(motion_artifact=2.0, noise_amplitude=0.1).samples())
        self.assertFalse(weak.valid)
        self.assertFalse(motion.valid)

    def test_baseline_rejects_invalid_measurement(self):
        result = HeartRateProcessor().process(SimulatedPPGSource(duration_seconds=2).samples())
        comparison = compare_to_baseline(72, result)
        self.assertEqual(comparison.classification, BaselineClassification.INVALID_MEASUREMENT)

    def test_baseline_classifies_reliable_change(self):
        result = HeartRateProcessor().process(SimulatedPPGSource(bpm=100).samples())
        comparison = compare_to_baseline(72, result)
        self.assertEqual(comparison.classification, BaselineClassification.CONCERNING)


if __name__ == "__main__":
    unittest.main()
