"""Tests unitaires des métriques faciales (EAR, MAR, pitch, yaw, seuil adaptatif)."""

import pytest

import config
from detectors import face_metrics as fm


def make_landmarks():
    """468 points à zéro, remplis ensuite selon le besoin du test."""
    return [(0.0, 0.0)] * 468


def set_eye(lm, idx, width, opening):
    """Oeil horizontal de largeur `width` et d'ouverture verticale `opening`."""
    p1, p2, p3, p4, p5, p6 = idx
    lm[p1] = (0.0, 0.0)
    lm[p4] = (width, 0.0)
    lm[p2] = (width * 0.3, -opening / 2)
    lm[p6] = (width * 0.3, opening / 2)
    lm[p3] = (width * 0.7, -opening / 2)
    lm[p5] = (width * 0.7, opening / 2)


def test_ear_open_eye():
    lm = make_landmarks()
    set_eye(lm, fm.LEFT_EYE, width=30.0, opening=9.0)
    assert fm.eye_aspect_ratio(lm, fm.LEFT_EYE) == pytest.approx(0.30)


def test_ear_closed_eye_is_below_threshold():
    lm = make_landmarks()
    set_eye(lm, fm.LEFT_EYE, width=30.0, opening=1.0)
    assert fm.eye_aspect_ratio(lm, fm.LEFT_EYE) < config.EAR_MIN


def test_ear_zero_width_does_not_crash():
    assert fm.eye_aspect_ratio(make_landmarks(), fm.LEFT_EYE) == 0.0


def test_mar_closed_and_yawning():
    lm = make_landmarks()
    lm[fm.MOUTH_LEFT], lm[fm.MOUTH_RIGHT] = (0, 0), (50, 0)
    lm[fm.MOUTH_TOP], lm[fm.MOUTH_BOTTOM] = (25, 0), (25, 2)
    assert fm.mouth_aspect_ratio(lm) < config.MAR_THRESHOLD
    lm[fm.MOUTH_BOTTOM] = (25, 25)
    assert fm.mouth_aspect_ratio(lm) > config.MAR_THRESHOLD


def test_pitch_ratio_neutral_vs_head_drop():
    lm = make_landmarks()
    lm[fm.FOREHEAD], lm[fm.CHIN] = (0, 0), (0, 100)
    lm[fm.NOSE_TIP] = (0, 40)
    assert fm.pitch_ratio(lm) == pytest.approx(0.60)   # nez-menton / front-menton
    assert fm.pitch_ratio(lm) > config.PITCH_DROP_THRESHOLD
    lm[fm.NOSE_TIP] = (0, 70)
    assert fm.pitch_ratio(lm) == pytest.approx(0.30)
    assert fm.pitch_ratio(lm) < config.PITCH_DROP_THRESHOLD


def test_yaw_ratio_center_and_sides():
    lm = make_landmarks()
    lm[fm.LEFT_CHEEK], lm[fm.RIGHT_CHEEK] = (100, 0), (200, 0)
    lm[fm.NOSE_TIP] = (150, 0)
    assert fm.yaw_ratio(lm) == pytest.approx(0.5)
    lm[fm.NOSE_TIP] = (110, 0)
    assert fm.yaw_ratio(lm) < config.YAW_LEFT_THRESHOLD
    lm[fm.NOSE_TIP] = (190, 0)
    assert fm.yaw_ratio(lm) > config.YAW_RIGHT_THRESHOLD


def test_adaptive_threshold_is_clamped():
    assert fm.adaptive_ear_threshold(0.60) == config.EAR_BASE   # visage très proche
    assert fm.adaptive_ear_threshold(0.30) == config.EAR_BASE
    assert fm.adaptive_ear_threshold(0.01) == config.EAR_MIN    # visage très lointain
    mid = fm.adaptive_ear_threshold(0.25)
    assert config.EAR_MIN < mid < config.EAR_BASE


def test_compute_metrics_flags():
    lm = make_landmarks()
    set_eye(lm, fm.LEFT_EYE, width=30.0, opening=1.0)
    set_eye(lm, fm.RIGHT_EYE, width=30.0, opening=1.0)
    lm[fm.LEFT_CHEEK], lm[fm.RIGHT_CHEEK] = (100, 0), (300, 0)   # visage large
    lm[fm.NOSE_TIP] = (200, 0)
    lm[fm.MOUTH_LEFT], lm[fm.MOUTH_RIGHT] = (150, 0), (250, 0)
    lm[fm.MOUTH_TOP], lm[fm.MOUTH_BOTTOM] = (200, 0), (200, 1)
    lm[fm.FOREHEAD], lm[fm.CHIN] = (200, -100), (200, 100)
    m = fm.compute_metrics(lm, frame_width=640)
    assert m.eyes_closed and m.eyes_drowsy
    assert not m.yawning and not m.looking_away
