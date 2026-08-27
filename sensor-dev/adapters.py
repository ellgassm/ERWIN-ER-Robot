"""Hardware boundary placeholders for later Raspberry Pi integration."""

from collections.abc import Iterable, Iterator
from typing import Protocol

try:
    from .interfaces import HandLandmarks, PPGSample
except ImportError:  # Supports running this isolated directory directly.
    from interfaces import HandLandmarks, PPGSample


class ArduinoSerialPort(Protocol):
    def __iter__(self) -> Iterator[bytes]:
        """Yield newline-delimited Arduino messages."""


class ArduinoSerialPPGSource:
    """Parse one numeric PPG value per serial line.

    The Arduino protocol is intentionally not assumed. This adapter supports
    the simplest future contract: one raw numeric sample per line, with local
    timestamps assigned on receipt. Replace the parser when the Arduino format
    is confirmed.
    """

    def __init__(self, port: ArduinoSerialPort, clock):
        self.port = port
        self.clock = clock

    def samples(self) -> Iterable[PPGSample]:
        for message in self.port:
            try:
                yield PPGSample(float(self.clock()), float(message.decode("ascii").strip()))
            except (UnicodeDecodeError, ValueError):
                continue


class CameraSource(Protocol):
    def landmarks(self) -> Iterable[HandLandmarks | None]:
        """Yield landmarks from a physical or recorded camera adapter."""


class MultiHandCameraSource(Protocol):
    def landmarks(self) -> Iterable[tuple[HandLandmarks, ...]]:
        """Yield zero, one, or two hands from each camera frame."""
