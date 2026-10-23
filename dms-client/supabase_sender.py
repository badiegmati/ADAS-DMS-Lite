"""
Envoi des alertes vers Supabase (API REST PostgREST, table `alertes`).

- POST {SUPABASE_URL}/rest/v1/alertes avec la clé anon et `Prefer: return=minimal`
- File d'attente EN MÉMOIRE (aucun stockage local) traitée par un thread
- 3 tentatives, attente 2 s puis 4 s, puis l'événement est abandonné (log)
- `event_uid` (UUID4) garantit l'idempotence : un renvoi n'est jamais dupliqué
  (HTTP 409 = déjà reçu = succès)
"""

import queue
import threading
import time
import uuid
from datetime import datetime, timezone

import requests

import config


def build_event(conducteur_code: str, type_alerte: str, description: str,
                latitude: float, longitude: float) -> dict:
    """Construit le JSON d'une alerte (colonnes de la table `alertes`)."""
    return {
        "event_uid": str(uuid.uuid4()),
        "conducteur_code": conducteur_code,
        "type_alerte": type_alerte,
        "description": description,
        "latitude": latitude,
        "longitude": longitude,
        "horodatage": datetime.now(timezone.utc).isoformat(),
    }


class SupabaseSender:
    def __init__(self, url: str, anon_key: str, dry_run: bool = False,
                 sleep=time.sleep, post=requests.post):
        self.endpoint = f"{url}/rest/v1/alertes"
        self.dry_run = dry_run
        self._sleep = sleep
        self._post = post
        self._headers = {
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }
        self._queue: "queue.Queue[dict | None]" = queue.Queue()
        self._thread = threading.Thread(target=self._worker, daemon=True, name="sender")
        self._thread.start()

    # ── API publique ──────────────────────────────────────────────────────
    def send(self, event: dict) -> None:
        """Met l'événement en file (non bloquant)."""
        self._queue.put(event)

    def stop(self, timeout: float = 15.0) -> None:
        """Vide la file puis arrête le thread."""
        self._queue.put(None)
        self._thread.join(timeout)

    # ── Interne ───────────────────────────────────────────────────────────
    def _worker(self) -> None:
        while True:
            event = self._queue.get()
            if event is None:
                return
            self.deliver(event)

    def deliver(self, event: dict) -> bool:
        """Envoie un événement avec retry/backoff. Retourne True si accepté."""
        if self.dry_run:
            print(f"[DRY-RUN] {event['type_alerte']} — {event['description']}")
            return True

        for attempt in range(1, config.SEND_ATTEMPTS + 1):
            try:
                resp = self._post(self.endpoint, json=event, headers=self._headers,
                                  timeout=config.SEND_TIMEOUT_S)
                if resp.status_code in (200, 201, 204, 409):
                    print(f"[SEND] OK {event['type_alerte']} ({resp.status_code})")
                    return True
                # Erreur définitive côté client (clé invalide, RLS, payload) : inutile de réessayer
                if 400 <= resp.status_code < 500 and resp.status_code != 429:
                    print(f"[SEND] REFUSÉ {event['type_alerte']} "
                          f"HTTP {resp.status_code} : {resp.text[:200]}")
                    return False
                print(f"[SEND] tentative {attempt} : HTTP {resp.status_code}")
            except requests.RequestException as exc:
                print(f"[SEND] tentative {attempt} : {exc.__class__.__name__}")

            if attempt < config.SEND_ATTEMPTS:
                self._sleep(config.SEND_BACKOFF_S[attempt - 1])

        print(f"[SEND] ABANDON {event['type_alerte']} après {config.SEND_ATTEMPTS} tentatives")
        return False
