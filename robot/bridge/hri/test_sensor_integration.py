import unittest
from types import SimpleNamespace

from hri.coordinator import HriCoordinator
from hri.hri_state_machine import AssistanceType, HriEvent, HriState
from hri.sensor_adapters import SensorEventAdapter


class RecordingDisplay:
    def __init__(self):
        self.states = []

    def show(self, session, state):
        self.states.append(state)


class SensorIntegrationTests(unittest.TestCase):
    def test_gesture_drives_vitals_flow_and_display(self):
        display = RecordingDisplay()
        coordinator = HriCoordinator(display)
        adapter = SensorEventAdapter(coordinator)
        coordinator.start("session-vitals")

        state = adapter.gesture(SimpleNamespace(gesture="ONE", confidence=0.9, confirmed=True))
        self.assertEqual(state, HriState.PAIN_INPUT)
        self.assertEqual(adapter.pain_finger_count(SimpleNamespace(count=4, confidence=0.9)), HriState.SENSOR_SETUP)
        self.assertEqual(adapter.ppg_attached(), HriState.HEART_RATE_MEASUREMENT)
        self.assertEqual(
            adapter.heart_rate(SimpleNamespace(bpm=72, valid=True, confidence=0.9)),
            HriState.DISPLAY_VITALS,
        )
        results_started_at = coordinator.results_started_at
        self.assertIsNotNone(results_started_at)
        self.assertEqual(coordinator.tick(now=results_started_at + 5), HriState.ASK_BREATHING_FOLLOWUP)
        self.assertEqual(
            adapter.gesture(SimpleNamespace(gesture="THUMBS_DOWN", confidence=0.9, confirmed=True)),
            HriState.END_SESSION,
        )
        self.assertIn(HriState.ASK_BREATHING_FOLLOWUP, display.states)

    def test_breathing_then_yes_vitals_flow(self):
        coordinator = HriCoordinator(breathing_duration_seconds=12)
        adapter = SensorEventAdapter(coordinator)
        coordinator.start("session-breathing")

        self.assertEqual(
            adapter.gesture(SimpleNamespace(gesture="TWO", confidence=0.9, confirmed=True)),
            HriState.BREATHING_EXERCISE,
        )
        self.assertEqual(coordinator.handle_breathing_complete(), HriState.ASK_VITALS_FOLLOWUP)
        self.assertEqual(
            adapter.gesture(SimpleNamespace(gesture="THUMBS_UP", confidence=0.9, confirmed=True)),
            HriState.PAIN_INPUT,
        )

    def test_breathing_auto_completes_after_configured_duration(self):
        coordinator = HriCoordinator(breathing_duration_seconds=12)
        adapter = SensorEventAdapter(coordinator)
        coordinator.start("session-breathing-timer")
        self.assertEqual(
            adapter.gesture(SimpleNamespace(gesture="TWO", confidence=0.9, confirmed=True)),
            HriState.BREATHING_EXERCISE,
        )

        started_at = coordinator.breathing_started_at
        self.assertIsNotNone(started_at)
        self.assertEqual(coordinator.tick(now=started_at + 11.9), HriState.BREATHING_EXERCISE)
        self.assertEqual(coordinator.tick(now=started_at + 12), HriState.ASK_VITALS_FOLLOWUP)

    def test_input_prompts_use_a_ten_second_fallback_boundary(self):
        coordinator = HriCoordinator(input_timeout_seconds=10)
        coordinator.start("session-fallback")
        selection_started_at = coordinator.state_started_at
        self.assertIsNotNone(selection_started_at)
        self.assertEqual(coordinator.tick(now=selection_started_at + 9.9), HriState.SELECT_ASSISTANCE)
        self.assertEqual(coordinator.tick(now=selection_started_at + 10), HriState.PAIN_INPUT)

        pain_started_at = coordinator.state_started_at
        self.assertIsNotNone(pain_started_at)
        self.assertEqual(coordinator.tick(now=pain_started_at + 9.9), HriState.PAIN_INPUT)
        self.assertEqual(coordinator.tick(now=pain_started_at + 10), HriState.SENSOR_SETUP)
        self.assertEqual(coordinator.session.pain_level, 4)

    def test_second_demo_session_can_default_to_breathing(self):
        coordinator = HriCoordinator(input_timeout_seconds=10)
        coordinator.start("session-two", AssistanceType.BREATHING)
        started_at = coordinator.state_started_at
        self.assertIsNotNone(started_at)
        self.assertEqual(coordinator.tick(now=started_at + 9.9), HriState.SELECT_ASSISTANCE)
        self.assertEqual(coordinator.tick(now=started_at + 10), HriState.BREATHING_EXERCISE)

    def test_pain_starts_mock_heart_rate_then_auto_completes_results(self):
        coordinator = HriCoordinator(
            sensor_setup_duration_seconds=10,
            heart_rate_duration_seconds=7,
            results_duration_seconds=5,
            mock_heart_rate_min_bpm=75,
            mock_heart_rate_max_bpm=105,
        )
        adapter = SensorEventAdapter(coordinator)
        coordinator.start("session-results")
        self.assertEqual(
            adapter.gesture(SimpleNamespace(gesture="ONE", confidence=0.9, confirmed=True)),
            HriState.PAIN_INPUT,
        )
        self.assertEqual(coordinator.handle_pain(4), HriState.SENSOR_SETUP)
        setup_started_at = coordinator.sensor_setup_started_at
        self.assertIsNotNone(setup_started_at)
        self.assertEqual(coordinator.tick(now=setup_started_at + 9.9), HriState.SENSOR_SETUP)
        self.assertEqual(coordinator.tick(now=setup_started_at + 10), HriState.HEART_RATE_MEASUREMENT)
        hr_started_at = coordinator.heart_rate_started_at
        self.assertIsNotNone(hr_started_at)
        self.assertEqual(coordinator.tick(now=hr_started_at + 6.9), HriState.HEART_RATE_MEASUREMENT)
        self.assertEqual(coordinator.tick(now=hr_started_at + 7), HriState.DISPLAY_VITALS)
        self.assertIsNotNone(coordinator.session.heart_rate)
        self.assertGreaterEqual(coordinator.session.heart_rate, 75)
        self.assertLessEqual(coordinator.session.heart_rate, 105)

        results_started_at = coordinator.results_started_at
        self.assertIsNotNone(results_started_at)
        self.assertEqual(coordinator.tick(now=results_started_at + 4.9), HriState.DISPLAY_VITALS)
        self.assertEqual(coordinator.tick(now=results_started_at + 5), HriState.ASK_BREATHING_FOLLOWUP)
        followup_started_at = coordinator.state_started_at
        self.assertIsNotNone(followup_started_at)
        self.assertEqual(coordinator.tick(now=followup_started_at + 8), HriState.ASK_BREATHING_FOLLOWUP)
        self.assertEqual(coordinator.tick(now=followup_started_at + 10), HriState.END_SESSION)
        end_started_at = coordinator.state_started_at
        self.assertIsNotNone(end_started_at)
        self.assertEqual(coordinator.tick(now=end_started_at + 2), HriState.COMPLETE)
        complete_started_at = coordinator.complete_started_at
        self.assertIsNotNone(complete_started_at)
        self.assertFalse(coordinator.completion_ready(now=complete_started_at + 1.9))
        self.assertTrue(coordinator.completion_ready(now=complete_started_at + 2))

    def test_unconfirmed_sensor_observation_is_ignored(self):
        coordinator = HriCoordinator()
        adapter = SensorEventAdapter(coordinator)
        coordinator.start("session-ignore")
        self.assertIsNone(adapter.gesture(SimpleNamespace(gesture="ONE", confidence=0.9, confirmed=False)))
        self.assertEqual(coordinator.state, HriState.SELECT_ASSISTANCE)
        self.assertIsNone(adapter.heart_rate(SimpleNamespace(bpm=72, valid=False, confidence=1.0)))


if __name__ == "__main__":
    unittest.main()
