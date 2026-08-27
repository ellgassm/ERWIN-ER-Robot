import unittest

from hri.coordinator import HriCoordinator
from hri.hri_state_machine import (
    AssistanceType,
    HriEvent,
    HriEventType,
    HriSession,
    HriState,
)


class RecordingDisplay:
    def __init__(self) -> None:
        self.states = []

    def show(self, session, state) -> None:
        self.states.append((session.session_id, state))


class HriSessionTests(unittest.TestCase):
    def test_arrival_starts_assistance_selection(self) -> None:
        session = HriSession.start("session-a")

        self.assertEqual(session.handle(HriEvent(HriEventType.ARRIVED)), HriState.SELECT_ASSISTANCE)

    def test_both_assistance_types_complete_in_selected_order(self) -> None:
        session = HriSession.start("session-a")
        session.handle(HriEvent(HriEventType.ARRIVED))

        self.assertEqual(
            session.handle(
                HriEvent(
                    HriEventType.SELECT_ASSISTANCE,
                    (AssistanceType.PAIN, AssistanceType.HEART_RATE),
                )
            ),
            HriState.PAIN_INPUT,
        )
        self.assertEqual(session.handle(HriEvent(HriEventType.PAIN_RECORDED)), HriState.HEART_RATE_MEASUREMENT)
        self.assertEqual(
            session.handle(HriEvent(HriEventType.HEART_RATE_RECORDED)),
            HriState.DISPLAY_VITALS,
        )
        self.assertEqual(session.handle(HriEvent(HriEventType.COMPLETE)), HriState.COMPLETE)

    def test_events_from_wrong_state_are_rejected(self) -> None:
        session = HriSession.start("session-a")

        with self.assertRaises(ValueError):
            session.handle(HriEvent(HriEventType.PAIN_RECORDED))

    def test_coordinator_renders_without_owning_display_details(self) -> None:
        display = RecordingDisplay()
        coordinator = HriCoordinator(display)

        self.assertEqual(coordinator.start("session-a"), HriState.SELECT_ASSISTANCE)
        self.assertEqual(
            display.states,
            [("session-a", HriState.GREETING), ("session-a", HriState.SELECT_ASSISTANCE)],
        )


if __name__ == "__main__":
    unittest.main()
