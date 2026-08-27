# ERWIN isolated sensor development

This directory is deliberately separate from the active robot lifecycle,
navigation bridge, display package, and production HRI state machine. It
contains hardware-independent prototype components and tests only.

## PPG pipeline

`ppg/processing.py` accepts timestamped raw samples and performs:

1. Recording-duration and timestamp validation.
2. DC removal using the sample mean.
3. Short moving-average smoothing.
4. Baseline removal using a longer moving average.
5. Local pulse-peak detection with minimum physiological spacing and prominence.
6. Plausible inter-beat interval filtering.
7. BPM estimation from the median interval.
8. Confidence scoring from interval consistency, waveform amplitude, noise, and beat coverage.

`HeartRateResult.valid` and `confidence` must be checked by a future HRI
controller. This is assistive screening/prototype processing, not a clinical
diagnostic algorithm.

`ppg/simulator.py` provides deterministic clean, noisy, weak, and motion-artifact
inputs through configurable parameters. The expected future hardware path is:

```text
Arduino PPG → USB serial → ArduinoSerialPPGSource → HeartRateProcessor
```

The Arduino protocol is not documented in this repository. The included serial
adapter assumes one numeric sample per line only as a replaceable starting
boundary; it does not claim to be the final firmware protocol.

## Baseline comparison

`ppg/comparison.py` compares a valid result to a patient baseline using absolute
and relative deltas. Thresholds are configurable prototype values:

```text
ELEVATED:   ≥15 BPM or ≥15%
CONCERNING: ≥25 BPM or ≥25%
```

An invalid or low-confidence result becomes `INVALID_MEASUREMENT`, never an
alert classification.

## Computer vision boundary

`cv/gestures.py` receives 21 normalized hand landmarks. It deliberately does
not import OpenCV, MediaPipe, ROS2, Supabase, or React. A future camera adapter
can provide landmarks through `CameraSource` in `adapters.py`.

Supported outputs are `ONE`, `TWO`, `THREE`, `FOUR`, `FIVE`, `THUMBS_UP`,
`THUMBS_DOWN`, `UNKNOWN`, and `NO_HAND_DETECTED`. `TemporalGestureConfirmer`
requires repeated high-confidence observations before confirming a gesture.

The classifier is a lightweight controlled-environment prototype, not a full
camera model. Physical camera testing and landmark-model selection remain
future Raspberry Pi work.

## Future HRI integration

The integration layer should consume observations, for example:

```text
HeartRateProcessor → HeartRateResult → HRI controller
GestureClassifier  → GestureResult   → HRI controller
```

The HRI controller—not these modules—decides whether `ONE` means vital
reassessment, whether `TWO` means breathing exercise, or whether a finger
count is a pain score. `HRIObservation` provides a neutral handoff shape for
that future adapter.

## Tests

From the repository root, run:

```bash
python -m unittest discover -s sensor-dev/tests -p "test_*.py"
```

The tests use only synthetic PPG samples and mocked landmarks. No Arduino,
camera, Raspberry Pi, ROS2, robot display, Supabase, or physical sensor is
required.
