"""Tests de EventTimer avec une horloge simulée (aucune attente réelle)."""

import pytest

from detectors.event_timer import EventTimer


class FakeClock:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t

    def advance(self, s):
        self.t += s


def test_fires_only_after_hold():
    clock = FakeClock()
    timer = EventTimer(hold=2.0, cooldown=10.0, clock=clock)
    assert timer.update(True) is None
    clock.advance(1.9)
    assert timer.update(True) is None
    clock.advance(0.2)
    assert timer.update(True) == pytest.approx(2.1)


def test_returns_real_duration():
    clock = FakeClock()
    timer = EventTimer(hold=2.0, clock=clock)
    timer.update(True)
    clock.advance(2.5)
    assert timer.update(True) == 2.5


def test_condition_interrupted_resets_hold():
    clock = FakeClock()
    timer = EventTimer(hold=2.0, clock=clock)
    timer.update(True)
    clock.advance(1.5)
    timer.update(False)          # interruption
    clock.advance(1.0)
    assert timer.update(True) is None   # le compteur repart de zéro
    clock.advance(2.0)
    assert timer.update(True) == 2.0


def test_cooldown_blocks_repeated_events():
    clock = FakeClock()
    timer = EventTimer(hold=1.0, cooldown=10.0, clock=clock)
    timer.update(True)
    clock.advance(1.0)
    assert timer.update(True) is not None       # 1er déclenchement
    clock.advance(5.0)
    assert timer.update(True) is None           # encore dans le cooldown
    clock.advance(5.0)
    assert timer.update(True) is not None       # cooldown écoulé


def test_once_per_session_then_new_session_after_gap():
    clock = FakeClock()
    timer = EventTimer(hold=2.0, cooldown=0.0, clock=clock,
                       once_per_session=True, session_gap=5.0)
    timer.update(True)
    clock.advance(2.0)
    assert timer.update(True) is not None       # événement de la session
    clock.advance(30.0)
    assert timer.update(True) is None           # même session : pas de doublon
    # le téléphone disparaît moins de 5 s : la session reste ouverte
    timer.update(False)
    clock.advance(3.0)
    timer.update(False)
    timer.update(True)
    clock.advance(3.0)
    assert timer.update(True) is None
    # absence de plus de 5 s : session fermée
    clock.advance(1.0)
    timer.update(False)
    clock.advance(6.0)
    timer.update(False)                         # ferme la session
    timer.update(True)
    clock.advance(2.0)
    assert timer.update(True) is not None       # nouvelle session => nouvel événement
