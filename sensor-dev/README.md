# ERWIN isolated sensor development

This directory remains separate from ROS2, the navigation bridge, display
package, and HRI transition logic. Its hardware-independent sensor components
now feed the HRI boundary through normalized result objects and the bridge's
documented JSON sensor topics.

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

The classifier is a lightweight controlled-environment classifier. The
`cv/mediapipe_adapter.py` boundary accepts MediaPipe HandLandmarker results,
including up to two hands, without making MediaPipe a required dependency of
the test suite. Physical camera capture, model installation, and ROS2
publishing remain Raspberry Pi work.

## HRI integration

The robot bridge consumes normalized observations through the HRI adapter. The
semantic mapping is:

```text
HeartRateProcessor → HeartRateResult → `/erwin/hri/heart_rate`
GestureClassifier  → GestureResult   → `/erwin/hri/gesture`
```

The HRI controller—not these modules—owns the transition rules. The bridge
maps confirmed `ONE` to vitals, confirmed `TWO` to breathing, and confirmed
thumbs-up/down to yes/no follow-ups. `TwoHandPainCounter` supplies a stable
0–10 candidate for the same pain event that the phone can submit.

## Tests

From the repository root, run:

```bash
python -m unittest discover -s sensor-dev/tests -p "test_*.py"
```

The tests use only synthetic PPG samples and mocked landmarks. No Arduino,
camera, Raspberry Pi, ROS2, robot display, Supabase, or physical sensor is
required.
