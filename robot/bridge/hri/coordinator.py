"""Coordinates the HRI domain state machine with external adapters."""

import time

from .hri_state_machine import HriEvent, HriSession, HriState
from .ports import HriDisplayPort


class HriCoordinator:
    """Own one HRI session and publish state changes to a display adapter.

    The display is optional while hardware transport is being integrated. In
    that mode the coordinator still validates all events and remains the
    single owner of HRI transitions, but does not pretend that a display is
    connected.
    """

    def __init__(
        self,
        display: HriDisplayPort | None = None,
        breathing_duration_seconds: float = 10.0,
        heart_rate_duration_seconds: float = 15.0,
        results_duration_seconds: float = 5.0,
        completion_duration_seconds: float = 2.0,
        sensor_setup_duration_seconds: float = 10.0,
        input_timeout_seconds: float = 10.0,
        passive_state_timeout_seconds: float = 2.0,
        mock_heart_rate_bpm: float = 72.0,
    ) -> None:
        if any(duration <= 0 for duration in (breathing_duration_seconds, heart_rate_duration_seconds, results_duration_seconds, completion_duration_seconds, sensor_setup_duration_seconds, input_timeout_seconds, passive_state_timeout_seconds)):
            raise ValueError("HRI durations must be greater than zero")
        if not 0 <= mock_heart_rate_bpm <= 300:
            raise ValueError("mock heart rate must be between 0 and 300")
        self.display = display
        self.breathing_duration_seconds = breathing_duration_seconds
        self.heart_rate_duration_seconds = heart_rate_duration_seconds
        self.results_duration_seconds = results_duration_seconds
        self.completion_duration_seconds = completion_duration_seconds
        self.sensor_setup_duration_seconds = sensor_setup_duration_seconds
        self.input_timeout_seconds = input_timeout_seconds
        self.passive_state_timeout_seconds = passive_state_timeout_seconds
        self.mock_heart_rate_bpm = mock_heart_rate_bpm
        self.breathing_started_at: float | None = None
        self.heart_rate_started_at: float | None = None
        self.results_started_at: float | None = None
        self.complete_started_at: float | None = None
        self.sensor_setup_started_at: float | None = None
        self.state_started_at: float | None = None
        self.session: HriSession | None = None

    @property
    def state(self) -> HriState | None:
        return self.session.state if self.session else None

    def start(self, session_id: str) -> HriState:
        self.session = HriSession.start(session_id)
        self._render()
        return self.handle(HriEvent.arrived())

    def handle(self, event: HriEvent) -> HriState:
        if self.session is None:
            raise RuntimeError("HRI session has not started")
        previous_state = self.session.state
        state = self.session.handle(event)
        if state != previous_state:
            self.state_started_at = time.monotonic()
        if state == HriState.BREATHING_EXERCISE and previous_state != state:
            self.breathing_started_at = time.monotonic()
        if state == HriState.HEART_RATE_MEASUREMENT and previous_state != state:
            self.heart_rate_started_at = time.monotonic()
        if state == HriState.DISPLAY_VITALS and previous_state != state:
            self.results_started_at = time.monotonic()
        if state == HriState.COMPLETE and previous_state != state:
            self.complete_started_at = time.monotonic()
        if state == HriState.SENSOR_SETUP and previous_state != state:
            self.sensor_setup_started_at = time.monotonic()
        if state != HriState.BREATHING_EXERCISE:
            self.breathing_started_at = None
        if state != HriState.HEART_RATE_MEASUREMENT:
            self.heart_rate_started_at = None
        if state != HriState.DISPLAY_VITALS:
            self.results_started_at = None
        if state != HriState.COMPLETE:
            self.complete_started_at = None
        if state != HriState.SENSOR_SETUP:
            self.sensor_setup_started_at = None
        self._render()
        return state

    def tick(self, now: float | None = None) -> HriState | None:
        """Advance coordinator-owned timed behavior.

        The display animation loops continuously, but the HRI coordinator owns
        the exercise duration and explicitly emits the existing completion
        event when that duration has elapsed.
        """
        if self.session is None:
            return None
        current_time = time.monotonic() if now is None else now
        if self.state_started_at is not None:
            elapsed = current_time - self.state_started_at
            if self.state == HriState.SELECT_ASSISTANCE and elapsed >= self.input_timeout_seconds:
                from .hri_state_machine import AssistanceType
                return self.handle(HriEvent.task_choice(AssistanceType.VITALS))
            if self.state == HriState.PAIN_INPUT and elapsed >= self.input_timeout_seconds:
                return self.handle_pain(4)
            if self.state in {HriState.ASK_BREATHING_FOLLOWUP, HriState.ASK_VITALS_FOLLOWUP} and elapsed >= self.input_timeout_seconds:
                return self.handle(HriEvent.followup_answer(False))
            if self.state in {HriState.END_SESSION, HriState.REVIEW} and elapsed >= self.passive_state_timeout_seconds:
                return self.handle(HriEvent.complete())
        if self.state == HriState.BREATHING_EXERCISE and self.breathing_started_at is not None:
            if current_time - self.breathing_started_at >= self.breathing_duration_seconds:
                return self.handle_breathing_complete()
        if self.state == HriState.HEART_RATE_MEASUREMENT and self.heart_rate_started_at is not None:
            if current_time - self.heart_rate_started_at >= self.heart_rate_duration_seconds:
                return self.handle_heart_rate(self.mock_heart_rate_bpm)
        if self.state == HriState.SENSOR_SETUP and self.sensor_setup_started_at is not None:
            if current_time - self.sensor_setup_started_at >= self.sensor_setup_duration_seconds:
                return self.handle_ppg_attached()
        if self.state == HriState.DISPLAY_VITALS and self.results_started_at is not None:
            if current_time - self.results_started_at >= self.results_duration_seconds:
                return self.handle(HriEvent.results_complete())
        return self.state

    def completion_ready(self, now: float | None = None) -> bool:
        """Return whether the thank-you display dwell has elapsed."""
        if self.state != HriState.COMPLETE or self.complete_started_at is None:
            return False
        current_time = time.monotonic() if now is None else now
        return current_time - self.complete_started_at >= self.completion_duration_seconds

    def handle_gesture(self, gesture: str) -> HriState:
        """Translate a confirmed sensor gesture into a domain event.

        The sensor adapter supplies the normalized gesture name. Mapping is
        kept here so CV code never owns HRI transition rules.
        """
        if self.session is None:
            raise RuntimeError("HRI session has not started")
        if self.state == HriState.SELECT_ASSISTANCE:
            choices = {"ONE": "vitals", "TWO": "breathing"}
            choice = choices.get(gesture.upper())
            if choice is None:
                raise ValueError("expected ONE or TWO for assistance selection")
            from .hri_state_machine import AssistanceType
            return self.handle(HriEvent.task_choice(AssistanceType(choice)))
        if self.state in {HriState.ASK_BREATHING_FOLLOWUP, HriState.ASK_VITALS_FOLLOWUP}:
            if gesture.upper() == "THUMBS_UP":
                return self.handle(HriEvent.followup_answer(True))
            if gesture.upper() == "THUMBS_DOWN":
                return self.handle(HriEvent.followup_answer(False))
            raise ValueError("expected THUMBS_UP or THUMBS_DOWN")
        raise ValueError(f"gesture input is invalid from {self.state.value}")

    def handle_pain(self, value: float) -> HriState:
        return self.handle(HriEvent.pain_input(value))

    def handle_heart_rate(self, value: float) -> HriState:
        return self.handle(HriEvent.heart_rate_ready(value))

    def handle_ppg_attached(self) -> HriState:
        return self.handle(HriEvent.ppg_attached())

    def handle_breathing_complete(self) -> HriState:
        return self.handle(HriEvent.breathing_complete())

    def clear(self) -> None:
        self.session = None
        self.breathing_started_at = None
        self.heart_rate_started_at = None
        self.results_started_at = None
        self.complete_started_at = None
        self.sensor_setup_started_at = None
        self.state_started_at = None

    def _render(self) -> None:
        if self.display is not None and self.session is not None:
            self.display.show(self.session, self.session.state)
