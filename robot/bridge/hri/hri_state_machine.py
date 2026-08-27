"""UI-independent robot-side HRI session state machine.

The coordinator owns semantic interaction behavior. Sensor adapters translate
CV, PPG, and phone observations into :class:`HriEvent` values; this module
does not import ROS2, MediaPipe, React, or database clients.
"""

from dataclasses import dataclass, field
from enum import Enum


class HriState(str, Enum):
    GREETING = "greeting"
    SELECT_ASSISTANCE = "select_assistance"
    PAIN_INPUT = "pain_input"
    HEART_RATE_MEASUREMENT = "heart_rate_measurement"
    SENSOR_SETUP = "sensor_setup"
    DISPLAY_VITALS = "display_vitals"
    ASK_BREATHING_FOLLOWUP = "ask_breathing_followup"
    BREATHING_EXERCISE = "breathing_exercise"
    ASK_VITALS_FOLLOWUP = "ask_vitals_followup"
    END_SESSION = "end_session"
    DISPATCH = "dispatch"
    REVIEW = "review"
    COMPLETE = "complete"


class HriEventType(str, Enum):
    ARRIVED = "arrived"
    SELECT_ASSISTANCE = "select_assistance"
    PAIN_RECORDED = "pain_recorded"
    HEART_RATE_RECORDED = "heart_rate_recorded"
    PPG_ATTACHED = "ppg_attached"
    HEART_RATE_READY = "heart_rate_ready"
    PAIN_INPUT = "pain_input"
    TASK_CHOICE = "task_choice"
    FOLLOWUP_ANSWER = "followup_answer"
    BREATHING_COMPLETE = "breathing_complete"
    RESULTS_COMPLETE = "results_complete"
    CONFIRM_THUMBS_UP = "confirm_thumbs_up"
    COMPLETE = "complete"


class AssistanceType(str, Enum):
    PAIN = "pain"
    HEART_RATE = "heart_rate"
    VITALS = "vitals"
    BREATHING = "breathing"


@dataclass(frozen=True)
class HriEvent:
    type: HriEventType
    assistance: tuple[AssistanceType, ...] = ()
    value: float | None = None
    task: AssistanceType | None = None
    answer: bool | None = None

    @classmethod
    def arrived(cls) -> "HriEvent":
        return cls(HriEventType.ARRIVED)

    @classmethod
    def task_choice(cls, task: AssistanceType) -> "HriEvent":
        return cls(HriEventType.TASK_CHOICE, task=task)

    @classmethod
    def pain_input(cls, value: float) -> "HriEvent":
        return cls(HriEventType.PAIN_INPUT, value=value)

    @classmethod
    def ppg_attached(cls) -> "HriEvent":
        return cls(HriEventType.PPG_ATTACHED)

    @classmethod
    def heart_rate_ready(cls, value: float) -> "HriEvent":
        return cls(HriEventType.HEART_RATE_READY, value=value)

    @classmethod
    def followup_answer(cls, answer: bool) -> "HriEvent":
        return cls(HriEventType.FOLLOWUP_ANSWER, answer=answer)

    @classmethod
    def breathing_complete(cls) -> "HriEvent":
        return cls(HriEventType.BREATHING_COMPLETE)

    @classmethod
    def results_complete(cls) -> "HriEvent":
        return cls(HriEventType.RESULTS_COMPLETE)

    @classmethod
    def confirm_thumbs_up(cls) -> "HriEvent":
        return cls(HriEventType.CONFIRM_THUMBS_UP)

    @classmethod
    def complete(cls) -> "HriEvent":
        return cls(HriEventType.COMPLETE)


@dataclass
class HriSession:
    """A single robot-side HRI interaction.

    The session is intentionally in-memory for this first slice. The
    existing database has no HRI-state column, and adding one is not required
    to establish the behavior boundary. Persistence will be added alongside
    the chosen display/input transport rather than inferred from UI state.
    """

    session_id: str
    state: HriState = HriState.GREETING
    plan: tuple[AssistanceType, ...] = ()
    recorded: set[AssistanceType] = field(default_factory=set)
    pain_level: float | None = None
    heart_rate: float | None = None
    vitals_done: bool = False
    breathing_done: bool = False

    @classmethod
    def start(cls, session_id: str) -> "HriSession":
        if not session_id:
            raise ValueError("session_id is required")
        return cls(session_id=session_id)

    def handle(self, event: HriEvent) -> HriState:
        """Apply one domain event and return the resulting HRI state."""
        if self.state == HriState.COMPLETE:
            return self.state

        if event.type == HriEventType.ARRIVED:
            if self.state != HriState.GREETING:
                raise ValueError(f"ARRIVED is invalid from {self.state.value}")
            self.state = HriState.SELECT_ASSISTANCE
            return self.state

        if event.type == HriEventType.SELECT_ASSISTANCE:
            self._require_state(HriState.SELECT_ASSISTANCE)
            if not event.assistance:
                raise ValueError("at least one assistance type is required")
            if any(item not in AssistanceType for item in event.assistance):
                raise ValueError("unsupported assistance type")
            self.plan = tuple(dict.fromkeys(event.assistance))
            self.state = self._next_unrecorded_state()
            return self.state

        if event.type == HriEventType.TASK_CHOICE:
            self._require_state(HriState.SELECT_ASSISTANCE)
            if event.task == AssistanceType.VITALS:
                self.plan = (AssistanceType.PAIN, AssistanceType.HEART_RATE)
                self.state = HriState.PAIN_INPUT
            elif event.task == AssistanceType.BREATHING:
                self.plan = (AssistanceType.BREATHING,)
                self.state = HriState.BREATHING_EXERCISE
            else:
                raise ValueError("task must be vitals or breathing")
            return self.state

        if event.type == HriEventType.PAIN_RECORDED:
            self._require_state(HriState.PAIN_INPUT)
            if event.value is not None:
                self._validate_pain(event.value)
            self.pain_level = event.value
            self.recorded.add(AssistanceType.PAIN)
            self.state = self._next_unrecorded_state()
            return self.state

        if event.type == HriEventType.PAIN_INPUT:
            self._require_state(HriState.PAIN_INPUT)
            self._validate_pain(event.value)
            self.pain_level = event.value
            self.recorded.add(AssistanceType.PAIN)
            self.state = HriState.SENSOR_SETUP if AssistanceType.HEART_RATE in self.plan else self._next_unrecorded_state()
            return self.state

        if event.type == HriEventType.PPG_ATTACHED:
            self._require_state(HriState.SENSOR_SETUP)
            self.state = HriState.HEART_RATE_MEASUREMENT
            return self.state

        if event.type == HriEventType.HEART_RATE_RECORDED:
            self._require_state(HriState.HEART_RATE_MEASUREMENT)
            if event.value is not None:
                self._validate_heart_rate(event.value)
            self.heart_rate = event.value
            self.recorded.add(AssistanceType.HEART_RATE)
            self.vitals_done = True
            self.state = HriState.DISPLAY_VITALS
            return self.state

        if event.type == HriEventType.HEART_RATE_READY:
            self._require_state(HriState.HEART_RATE_MEASUREMENT)
            self._validate_heart_rate(event.value)
            self.heart_rate = event.value
            self.recorded.add(AssistanceType.HEART_RATE)
            self.vitals_done = True
            self.state = HriState.DISPLAY_VITALS
            return self.state

        if event.type == HriEventType.CONFIRM_THUMBS_UP:
            self._require_state(HriState.DISPLAY_VITALS)
            self.vitals_done = True
            self.state = self._next_followup_state(AssistanceType.BREATHING)
            return self.state

        if event.type == HriEventType.RESULTS_COMPLETE:
            self._require_state(HriState.DISPLAY_VITALS)
            self.state = self._next_followup_state(AssistanceType.BREATHING)
            return self.state

        if event.type == HriEventType.BREATHING_COMPLETE:
            self._require_state(HriState.BREATHING_EXERCISE)
            self.breathing_done = True
            self.recorded.add(AssistanceType.BREATHING)
            self.state = self._next_followup_state(AssistanceType.VITALS)
            return self.state

        if event.type == HriEventType.FOLLOWUP_ANSWER:
            if event.answer is None:
                raise ValueError("follow-up answer is required")
            if self.state == HriState.ASK_BREATHING_FOLLOWUP:
                self.state = HriState.BREATHING_EXERCISE if event.answer else HriState.END_SESSION
                return self.state
            if self.state == HriState.ASK_VITALS_FOLLOWUP:
                self.state = HriState.PAIN_INPUT if event.answer else HriState.END_SESSION
                return self.state
            raise ValueError(f"follow-up answer is invalid from {self.state.value}")

        if event.type == HriEventType.COMPLETE:
            if self.state not in {HriState.DISPLAY_VITALS, HriState.REVIEW, HriState.END_SESSION, HriState.DISPATCH}:
                raise ValueError(f"{self.state.value} cannot accept completion")
            self.state = HriState.COMPLETE
            return self.state

        raise ValueError(f"unsupported HRI event: {event.type.value}")

    def _next_unrecorded_state(self) -> HriState:
        for assistance in self.plan:
            if assistance in self.recorded:
                continue
            if assistance == AssistanceType.PAIN:
                return HriState.PAIN_INPUT
            if assistance == AssistanceType.HEART_RATE:
                return HriState.HEART_RATE_MEASUREMENT
            if assistance == AssistanceType.BREATHING:
                return HriState.BREATHING_EXERCISE
        return HriState.REVIEW

    def _next_followup_state(self, other: AssistanceType) -> HriState:
        if other == AssistanceType.BREATHING and not self.breathing_done:
            return HriState.ASK_BREATHING_FOLLOWUP
        if other == AssistanceType.VITALS and not self.vitals_done:
            return HriState.ASK_VITALS_FOLLOWUP
        return HriState.END_SESSION

    @staticmethod
    def _validate_pain(value: float | None) -> None:
        if value is None or not 0 <= value <= 10:
            raise ValueError("pain value must be between 0 and 10")

    @staticmethod
    def _validate_heart_rate(value: float | None) -> None:
        if value is None or not 0 <= value <= 300:
            raise ValueError("heart rate must be between 0 and 300")

    def _require_state(self, expected: HriState) -> None:
        if self.state != expected:
            raise ValueError(f"{self.state.value} cannot accept this event; expected {expected.value}")
