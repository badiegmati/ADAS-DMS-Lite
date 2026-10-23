"""
Simulateur GPS : trajet aléatoire autour du centre de Tunis.

Cap ~45° avec un bruit de ±3°, avance de 10 à 20 m à chaque appel de next().
Si le véhicule s'éloigne de plus de 3 km, il fait demi-tour.
"""

import math
import random

import config

EARTH_M_PER_DEG_LAT = 111_320.0


class GpsSimulator:
    def __init__(self, start=config.GPS_START, heading_deg=config.GPS_HEADING_DEG,
                 seed=None):
        self._rng = random.Random(seed)
        self._origin = start
        self.lat, self.lon = start
        self.heading = heading_deg

    def _distance_from_origin_m(self) -> float:
        dlat = (self.lat - self._origin[0]) * EARTH_M_PER_DEG_LAT
        dlon = (self.lon - self._origin[1]) * EARTH_M_PER_DEG_LAT * math.cos(math.radians(self.lat))
        return math.hypot(dlat, dlon)

    def next(self):
        """Avance d'un pas et retourne (latitude, longitude) arrondies à 6 décimales."""
        if self._distance_from_origin_m() > config.GPS_MAX_RADIUS_M:
            self.heading = (self.heading + 180.0) % 360.0
        heading = self.heading + self._rng.uniform(-config.GPS_NOISE_DEG, config.GPS_NOISE_DEG)
        step = self._rng.uniform(*config.GPS_STEP_M)
        rad = math.radians(heading)
        self.lat += step * math.cos(rad) / EARTH_M_PER_DEG_LAT
        self.lon += step * math.sin(rad) / (EARTH_M_PER_DEG_LAT * math.cos(math.radians(self.lat)))
        return round(self.lat, 6), round(self.lon, 6)
