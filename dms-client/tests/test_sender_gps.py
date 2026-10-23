"""Tests de l'envoi (retry/backoff, idempotence) et du simulateur GPS."""

import math

import requests

import config
from gps_simulator import GpsSimulator
from supabase_sender import SupabaseSender, build_event


class FakeResponse:
    def __init__(self, status, text=""):
        self.status_code = status
        self.text = text


def make_sender(responses, sleeps):
    """Sender dont requests.post est remplacé par une liste de réponses/erreurs."""
    calls = []

    def fake_post(url, json=None, headers=None, timeout=None):
        calls.append((url, json, headers))
        item = responses.pop(0)
        if isinstance(item, Exception):
            raise item
        return item

    sender = SupabaseSender("https://x.supabase.co", "KEY", sleep=sleeps.append, post=fake_post)
    return sender, calls


def event():
    return build_event("C10", "PHONE", "test", 36.8, 10.18)


def test_build_event_has_all_columns():
    e = event()
    assert set(e) == {"event_uid", "conducteur_code", "type_alerte", "description",
                      "latitude", "longitude", "horodatage"}
    assert e["horodatage"].endswith("+00:00")           # UTC ISO 8601


def test_success_sends_expected_request():
    sleeps = []
    sender, calls = make_sender([FakeResponse(201)], sleeps)
    assert sender.deliver(event()) is True
    url, _, headers = calls[0]
    assert url == "https://x.supabase.co/rest/v1/alertes"
    assert headers["Prefer"] == "return=minimal"
    assert headers["apikey"] == "KEY" and headers["Authorization"] == "Bearer KEY"
    assert sleeps == []
    sender.stop()


def test_retry_with_backoff_2s_then_4s_then_success():
    sleeps = []
    sender, calls = make_sender(
        [requests.ConnectionError(), FakeResponse(503), FakeResponse(201)], sleeps)
    assert sender.deliver(event()) is True
    assert len(calls) == 3
    assert sleeps == [2.0, 4.0]
    sender.stop()


def test_gives_up_after_three_attempts():
    sleeps = []
    sender, calls = make_sender([requests.Timeout()] * 3, sleeps)
    assert sender.deliver(event()) is False
    assert len(calls) == config.SEND_ATTEMPTS
    assert sleeps == [2.0, 4.0]
    sender.stop()


def test_client_error_is_not_retried():
    sleeps = []
    sender, calls = make_sender([FakeResponse(401, "invalid key")], sleeps)
    assert sender.deliver(event()) is False
    assert len(calls) == 1 and sleeps == []
    sender.stop()


def test_conflict_409_counts_as_success():
    sender, calls = make_sender([FakeResponse(409)], [])
    assert sender.deliver(event()) is True
    sender.stop()


def test_gps_moves_10_to_20_m_and_stays_near_tunis():
    gps = GpsSimulator(seed=42)
    prev = config.GPS_START
    for _ in range(200):
        lat, lon = gps.next()
        dlat = (lat - prev[0]) * 111_320
        dlon = (lon - prev[1]) * 111_320 * math.cos(math.radians(lat))
        assert 9.5 <= math.hypot(dlat, dlon) <= 20.5      # tolérance d'arrondi
        prev = (lat, lon)
    # reste dans un rayon raisonnable autour de Tunis centre
    assert abs(prev[0] - 36.8065) < 0.05 and abs(prev[1] - 10.1815) < 0.05


def test_gps_turns_back_beyond_radius():
    gps = GpsSimulator(seed=1)
    for _ in range(3000):
        gps.next()
    dist = gps._distance_from_origin_m()
    assert dist < config.GPS_MAX_RADIUS_M + 100
