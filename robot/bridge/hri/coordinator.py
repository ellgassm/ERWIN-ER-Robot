"""Coordinates the HRI domain state machine with external adapters."""

from .hri_state_machine import HriEvent, HriSession, HriState
from .ports import HriDisplayPort


class HriCoordinator:
    """Own one HRI session and publish state changes to a display adapter.

    The display is optional while hardware transport is being integrated. In
    that mode the coordinator still validates all events and remains the
    single owner of HRI transitions, but does not pretend that a display is
    connected.
    """

    def __init__(self, display: HriDisplayPort | None = None) -> None:
        self.display = display
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
        state = self.session.handle(event)
        self._render()
        return state

    def clear(self) -> None:
        self.session = None

    def _render(self) -> None:
        if self.display is not None and self.session is not None:
            self.display.show(self.session, self.session.state)
