"""UI-independent HRI session state machine.

This module owns HRI behavior concepts, not rendering or ROS2 details. A
future display adapter can render the current state and translate user input
into HriEvent values without coupling the state machine to a UI framework.
"""

from dataclasses import dataclass, field
from enum import Enum


class HriState(str, Enum):
    GREETING = "greeting"
    SELECT_ASSISTANCE = "select_assistance"
    PAIN_INPUT = "pain_input"
    HEART_RATE_MEASUREMENT = "heart_rate_measurement"
    REVIEW = "review"
    COMPLETE = "complete"


class HriEventType(str, Enum):
    ARRIVED = "arrived"
    SELECT_ASSISTANCE = "select_assistance"
    PAIN_RECORDED = "pain_recorded"
    HEART_RATE_RECORDED = "heart_rate_recorded"
    COMPLETE = "complete"


class AssistanceType(str, Enum):
    PAIN = "pain"
    HEART_RATE = "heart_rate"


@dataclass(frozen=True)
class HriEvent:
    type: HriEventType
    assistance: tuple[AssistanceType, ...] = ()

    @classmethod
    def arrived(cls) -> "HriEvent":
        return cls(HriEventType.ARRIVED)


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

        if event.type == HriEventType.PAIN_RECORDED:
            self._require_state(HriState.PAIN_INPUT)
            self.recorded.add(AssistanceType.PAIN)
            self.state = self._next_unrecorded_state()
            return self.state

        if event.type == HriEventType.HEART_RATE_RECORDED:
            self._require_state(HriState.HEART_RATE_MEASUREMENT)
            self.recorded.add(AssistanceType.HEART_RATE)
            self.state = self._next_unrecorded_state()
            return self.state

        if event.type == HriEventType.COMPLETE:
            self._require_state(HriState.REVIEW)
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
        return HriState.REVIEW

    def _require_state(self, expected: HriState) -> None:
        if self.state != expected:
            raise ValueError(f"{self.state.value} cannot accept this event; expected {expected.value}")
