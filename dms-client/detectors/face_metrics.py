"""
Métriques faciales à partir des repères MediaPipe FaceMesh (468 points).

Les fonctions sont PURES (listes de points (x, y) en pixels) : elles ne
dépendent ni d'OpenCV ni de MediaPipe, donc facilement testables.
"""

from dataclasses import dataclass

import numpy as np

import config

# ── Indices des repères MediaPipe ─────────────────────────────────────────
LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]
MOUTH_LEFT, MOUTH_RIGHT = 61, 291       # coins de la bouche
MOUTH_TOP, MOUTH_BOTTOM = 13, 14        # lèvres (verticale)
NOSE_TIP, CHIN, FOREHEAD = 1, 152, 10
LEFT_CHEEK, RIGHT_CHEEK = 234, 454


def dist(p1, p2) -> float:
    """Distance euclidienne entre deux points."""
    return float(np.linalg.norm(np.array(p1, dtype=float) - np.array(p2, dtype=float)))


def eye_aspect_ratio(lm, eye_idx) -> float:
    """EAR = (|p2-p6| + |p3-p5|) / (2 |p1-p4|). Petit => oeil fermé."""
    p1, p2, p3, p4, p5, p6 = (lm[i] for i in eye_idx)
    horizontal = dist(p1, p4)
    if horizontal == 0:
        return 0.0
    return (dist(p2, p6) + dist(p3, p5)) / (2.0 * horizontal)


def mouth_aspect_ratio(lm) -> float:
    """MAR = ouverture verticale (13-14) / largeur de bouche (61-291)."""
    width = dist(lm[MOUTH_LEFT], lm[MOUTH_RIGHT])
    if width == 0:
        return 0.0
    return dist(lm[MOUTH_TOP], lm[MOUTH_BOTTOM]) / width


def pitch_ratio(lm) -> float:
    """|nez-menton| / |front-menton| : diminue quand la tête tombe."""
    face_h = dist(lm[FOREHEAD], lm[CHIN])
    if face_h == 0:
        return 0.5
    return dist(lm[NOSE_TIP], lm[CHIN]) / face_h


def yaw_ratio(lm) -> float:
    """Position horizontale du nez entre les joues : 0,5 = face à la route."""
    left, right = lm[LEFT_CHEEK][0], lm[RIGHT_CHEEK][0]
    width = right - left
    if width == 0:
        return 0.5
    return (lm[NOSE_TIP][0] - left) / width


def adaptive_ear_threshold(face_width_ratio: float) -> float:
    """
    Seuil EAR proportionnel à la largeur du visage dans l'image.
    Visage proche (>= EAR_FACE_REF) => EAR_BASE ; plus il s'éloigne, plus le
    seuil baisse, sans descendre sous EAR_MIN.
    """
    thr = config.EAR_BASE * (face_width_ratio / config.EAR_FACE_REF)
    return max(config.EAR_MIN, min(config.EAR_BASE, thr))


@dataclass
class FaceMetrics:
    ear: float
    ear_threshold: float
    mar: float
    pitch: float
    yaw: float

    @property
    def eyes_closed(self) -> bool:
        return self.ear < self.ear_threshold

    @property
    def eyes_drowsy(self) -> bool:
        return self.ear < self.ear_threshold + config.EAR_DROWSY_MARGIN

    @property
    def yawning(self) -> bool:
        return self.mar > config.MAR_THRESHOLD

    @property
    def head_drop(self) -> bool:
        return self.pitch < config.PITCH_DROP_THRESHOLD

    @property
    def looking_away(self) -> bool:
        return self.yaw < config.YAW_LEFT_THRESHOLD or self.yaw > config.YAW_RIGHT_THRESHOLD


def compute_metrics(lm, frame_width: int) -> FaceMetrics:
    """Calcule toutes les métriques d'un visage (lm = points en pixels)."""
    ear = (eye_aspect_ratio(lm, LEFT_EYE) + eye_aspect_ratio(lm, RIGHT_EYE)) / 2.0
    face_w_ratio = dist(lm[LEFT_CHEEK], lm[RIGHT_CHEEK]) / max(frame_width, 1)
    return FaceMetrics(
        ear=ear,
        ear_threshold=adaptive_ear_threshold(face_w_ratio),
        mar=mouth_aspect_ratio(lm),
        pitch=pitch_ratio(lm),
        yaw=yaw_ratio(lm),
    )
