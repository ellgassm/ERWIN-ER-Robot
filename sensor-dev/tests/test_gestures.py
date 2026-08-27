import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cv.gestures import Gesture, GestureClassifier, GestureResult, TemporalGestureConfirmer
from interfaces import HandLandmarks, Point


def hand(extended: set[int], thumb: str | None = None) -> HandLandmarks:
    points = [Point(0.5, 0.8) for _ in range(21)]
    finger_bases = [(0.35, 0.5), (0.45, 0.45), (0.55, 0.45), (0.65, 0.5)]
    tips = (8, 12, 16, 20)
    pips = (6, 10, 14, 18)
    for finger, ((x, pip_y), tip_index, pip_index) in enumerate(zip(finger_bases, tips, pips)):
        points[pip_index] = Point(x, pip_y)
        points[tip_index] = Point(x, 0.1 if finger in extended else 0.55)
    points[2] = Point(0.25, 0.45)
    points[4] = Point(0.2, 0.1 if thumb == "up" else 0.7 if thumb == "down" else 0.5)
    return HandLandmarks(tuple(points))


class GestureTests(unittest.TestCase):
    def test_finger_count_and_no_hand(self):
        classifier = GestureClassifier()
        self.assertEqual(classifier.classify(hand({0}), 1).gesture, Gesture.ONE)
        self.assertEqual(classifier.classify(hand({0, 1}), 2).gesture, Gesture.TWO)
        self.assertEqual(classifier.classify(None, 3).gesture, Gesture.NO_HAND_DETECTED)

    def test_thumbs(self):
        classifier = GestureClassifier()
        self.assertEqual(classifier.classify(hand(set(), "up"), 1).gesture, Gesture.THUMBS_UP)
        self.assertEqual(classifier.classify(hand(set(), "down"), 2).gesture, Gesture.THUMBS_DOWN)

    def test_temporal_confirmation(self):
        confirmer = TemporalGestureConfirmer(required_frames=3)
        for index in (1, 2):
            result = confirmer.update(GestureResult(Gesture.TWO, 0.9, index))
            self.assertFalse(result.confirmed)
        result = confirmer.update(GestureResult(Gesture.TWO, 0.9, 3))
        self.assertTrue(result.confirmed)
        unknown = confirmer.update(GestureResult(Gesture.UNKNOWN, 0.9, 4))
        self.assertFalse(unknown.confirmed)


if __name__ == "__main__":
    unittest.main()
