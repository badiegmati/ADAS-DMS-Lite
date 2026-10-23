"""
EventTimer : déclenche un événement quand une condition reste vraie pendant
`hold` secondes, puis impose un délai de récurrence `cooldown`.

Basé sur une horloge injectable (time.time par défaut) pour pouvoir tester
le comportement temporel sans attendre.

Mode `once_per_session` (téléphone) : un seul événement par session ; la
session se ferme après `session_gap` secondes sans détection.
"""

import time


class EventTimer:
    def __init__(self, hold: float, cooldown: float = 0.0, clock=time.time,
                 once_per_session: bool = False, session_gap: float = 5.0):
        self.hold = hold
        self.cooldown = cooldown
        self.once_per_session = once_per_session
        self.session_gap = session_gap
        self._clock = clock
        self._start = None            # début de la période "condition vraie"
        self._last_fired = None       # dernier déclenchement
        self._last_active = None      # dernière fois où la condition était vraie
        self._session_fired = False

    def update(self, active: bool):
        """
        À appeler à chaque frame. Retourne la durée réelle (en s) quand
        l'événement se déclenche, sinon None.
        """
        now = self._clock()

        if not active:
            self._start = None
            # Fin de session téléphone : absence prolongée
            if (self.once_per_session and self._session_fired
                    and self._last_active is not None
                    and now - self._last_active >= self.session_gap):
                self._session_fired = False
            return None

        self._last_active = now
        if self._start is None:
            self._start = now

        if self.once_per_session and self._session_fired:
            return None

        held = now - self._start
        if held < self.hold:
            return None
        if self._last_fired is not None and now - self._last_fired < self.cooldown:
            return None

        self._last_fired = now
        self._session_fired = True
        return held

    @property
    def held_seconds(self) -> float:
        """Durée pendant laquelle la condition est vraie en continu (pour l'affichage)."""
        return 0.0 if self._start is None else self._clock() - self._start
