"""
Configuration du client DMS : lecture du .env + constantes de seuils.

Tous les seuils temporels sont exprimés en SECONDES RÉELLES (time.time()),
jamais en nombre de frames : le comportement ne dépend donc pas des FPS.
"""

import os

from dotenv import load_dotenv

load_dotenv()


def _bool(name: str, default: bool) -> bool:
    """Lit un booléen depuis l'environnement (1/true/yes/on)."""
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


# ── Connexion Supabase / conducteur ───────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
CONDUCTEUR_CODE = os.getenv("CONDUCTEUR_CODE", "C10")
CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "0"))
SHOW_PREVIEW = _bool("SHOW_PREVIEW", True)

# ── Envoi ─────────────────────────────────────────────────────────────────
SEND_ATTEMPTS = 3          # 3 tentatives par événement
SEND_BACKOFF_S = (2.0, 4.0)  # attente après l'échec n°1 puis n°2
SEND_TIMEOUT_S = 8.0

# ── Seuils des métriques faciales ─────────────────────────────────────────
EAR_MIN = 0.16             # seuil EAR le plus bas (visage lointain)
EAR_BASE = 0.22            # seuil EAR visage proche
EAR_FACE_REF = 0.30        # largeur de visage (fraction de l'image) = seuil max
EAR_DROWSY_MARGIN = 0.04   # somnolence : seuil + 0,04
MAR_THRESHOLD = 0.18       # bâillement
PITCH_DROP_THRESHOLD = 0.42
YAW_LEFT_THRESHOLD = 0.32
YAW_RIGHT_THRESHOLD = 0.68

# ── Téléphone (YOLOv8n, classe COCO 67 = "cell phone") ────────────────────
YOLO_MODEL = "yolov8n.pt"
PHONE_CLASS_ID = 67
PHONE_CONFIDENCE = 0.45
PHONE_INTERVAL_S = 0.15
PHONE_SESSION_GAP_S = 5.0  # absence de 5 s => la session téléphone est fermée

# ── Règles événements : maintien (hold) et récurrence (cooldown) en s ─────
EVENT_RULES = {
    "FATIGUE_EYES_DROWSY": {"hold": 1.0, "cooldown": 15.0},
    "FATIGUE_EYES_CLOSED": {"hold": 2.0, "cooldown": 10.0},
    "FATIGUE_YAWN":        {"hold": 2.0, "cooldown": 30.0},
    "FATIGUE_DROP":        {"hold": 2.0, "cooldown": 20.0},
    "DISTRACTION":         {"hold": 1.5, "cooldown": 15.0},
    "PHONE":               {"hold": 2.0, "cooldown": 0.0, "once_per_session": True},
}

# Descriptions affichées côté application (durée réelle en secondes)
DESCRIPTIONS = {
    "FATIGUE_EYES_DROWSY": "Yeux mi-clos pendant {d:.1f} s",
    "FATIGUE_EYES_CLOSED": "Yeux fermés pendant {d:.1f} s",
    "FATIGUE_YAWN":        "Bâillement prolongé ({d:.1f} s)",
    "FATIGUE_DROP":        "Tête penchée vers l'avant pendant {d:.1f} s",
    "DISTRACTION":         "Regard détourné de la route pendant {d:.1f} s",
    "PHONE":               "Téléphone utilisé au volant ({d:.1f} s)",
}

# ── GPS simulé (centre de Tunis) ──────────────────────────────────────────
GPS_START = (36.8065, 10.1815)
GPS_HEADING_DEG = 45.0
GPS_NOISE_DEG = 3.0
GPS_STEP_M = (10.0, 20.0)
GPS_MAX_RADIUS_M = 3000.0
