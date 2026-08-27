"""Ports for connecting HRI behavior to a physical display/input adapter."""

from collections.abc import Callable
from typing import Protocol

from .hri_state_machine import HriEvent, HriSession, HriState


class HriDisplayPort(Protocol):
    """Render robot-side HRI state without exposing UI details to the domain."""

    def show(self, session: HriSession, state: HriState) -> None:
        ...


class HriInputPort(Protocol):
    """Deliver display/sensor events to the HRI coordinator."""

    def subscribe(self, on_event: Callable[[HriEvent], None]) -> None:
        ...
