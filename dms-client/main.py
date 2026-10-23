"""
ADAS-DMS Lite — Client PC (CAM1)

Boucle principale : capture → métriques → événements → envoi vers Supabase.

Usage :
    python main.py                       # webcam réelle
    python main.py --simulate            # événements factices (sans webcam)
    python main.py --simulate --type PHONE --count 1
    python main.py --dry-run             # affiche au lieu d'envoyer
    python main.py --cam 1 --no-preview --code C10
"""

import argparse
import sys
import time

import config
from detectors.event_timer import EventTimer
from gps_simulator import GpsSimulator
from supabase_sender import SupabaseSender, build_event

# Durées factices utilisées par le mode --simulate
SIMULATION_SEQUENCE = [
    ("DISTRACTION", 1.8),
    ("FATIGUE_YAWN", 2.4),
    ("FATIGUE_DROP", 2.2),
    ("FATIGUE_EYES_DROWSY", 1.2),
    ("FATIGUE_EYES_CLOSED", 2.6),
    ("PHONE", 3.1),
]


# ══════════════════════════════════════════════════════════════════════════
# Utilitaires
# ══════════════════════════════════════════════════════════════════════════

def make_timers() -> dict:
    """Un EventTimer par type d'événement, selon config.EVENT_RULES."""
    timers = {}
    for type_alerte, rule in config.EVENT_RULES.items():
        timers[type_alerte] = EventTimer(
            hold=rule["hold"],
            cooldown=rule["cooldown"],
            once_per_session=rule.get("once_per_session", False),
            session_gap=config.PHONE_SESSION_GAP_S,
        )
    return timers


def emit(sender: SupabaseSender, gps: GpsSimulator, code: str,
         type_alerte: str, duration: float) -> None:
    """Construit l'alerte (GPS simulé + description) et la met en file d'envoi."""
    lat, lon = gps.next()
    description = config.DESCRIPTIONS[type_alerte].format(d=duration)
    sender.send(build_event(code, type_alerte, description, lat, lon))
    print(f"[ALERTE] {type_alerte} — {description} @ ({lat}, {lon})")


# ══════════════════════════════════════════════════════════════════════════
# Mode simulation (sans webcam)
# ══════════════════════════════════════════════════════════════════════════

def run_simulation(sender, gps, code, interval, count, only_type=None) -> None:
    sequence = [s for s in SIMULATION_SEQUENCE if only_type in (None, s[0])]
    if not sequence:
        print(f"Type inconnu : {only_type}")
        return
    sent, i = 0, 0
    print(f"[SIM] Conducteur {code} — un événement toutes les {interval} s (Ctrl+C pour arrêter)")
    while count == 0 or sent < count:
        type_alerte, duration = sequence[i % len(sequence)]
        emit(sender, gps, code, type_alerte, duration)
        sent += 1
        i += 1
        if count == 0 or sent < count:
            time.sleep(interval)


# ══════════════════════════════════════════════════════════════════════════
# Mode webcam
# ══════════════════════════════════════════════════════════════════════════

def run_webcam(sender, gps, code, cam_index, preview) -> None:
    # Imports lourds ici : le mode --simulate et les tests n'en ont pas besoin
    import cv2
    import mediapipe as mp

    from camera import Camera
    from detectors.face_metrics import compute_metrics
    from detectors.phone_detector import PhoneDetector

    camera = Camera(cam_index)
    if not camera.is_opened():
        print(f"[DMS] ERREUR : impossible d'ouvrir la caméra {cam_index}")
        return

    face_mesh = mp.solutions.face_mesh.FaceMesh(
        max_num_faces=1, refine_landmarks=False,
        min_detection_confidence=0.5, min_tracking_confidence=0.5,
    )
    phone = PhoneDetector()
    phone.start()
    timers = make_timers()
    last_alert = {}          # type -> instant du dernier déclenchement (pour l'affichage)
    frame_idx = 0
    print(f"[DMS] Démarré — caméra {cam_index}, conducteur {code}. ESC pour quitter.")

    try:
        while True:
            frame = camera.read()
            if frame is None:
                time.sleep(0.05)
                continue
            h, w = frame.shape[:2]

            # ── Métriques faciales ────────────────────────────────────────
            metrics = None
            result = face_mesh.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            if result.multi_face_landmarks:
                lm = [(p.x * w, p.y * h) for p in result.multi_face_landmarks[0].landmark]
                metrics = compute_metrics(lm, w)

            if frame_idx % 4 == 0:
                phone.submit(frame)
            frame_idx += 1

            # ── Conditions → événements ───────────────────────────────────
            conditions = {
                "FATIGUE_EYES_DROWSY": bool(metrics and metrics.eyes_drowsy),
                "FATIGUE_EYES_CLOSED": bool(metrics and metrics.eyes_closed),
                "FATIGUE_YAWN": bool(metrics and metrics.yawning),
                "FATIGUE_DROP": bool(metrics and metrics.head_drop),
                "DISTRACTION": bool(metrics and metrics.looking_away),
                "PHONE": phone.detected,
            }
            for type_alerte, active in conditions.items():
                duration = timers[type_alerte].update(active)
                if duration is not None:
                    emit(sender, gps, code, type_alerte, duration)
                    last_alert[type_alerte] = time.time()

            # ── Affichage ─────────────────────────────────────────────────
            if preview:
                draw_hud(cv2, frame, metrics, conditions, last_alert, cam_index)
                cv2.imshow("DMS — Driver Monitor", frame)
                if cv2.waitKey(1) & 0xFF == 27:   # ESC
                    break
    except KeyboardInterrupt:
        pass
    finally:
        camera.release()
        phone.stop()
        face_mesh.close()
        if preview:
            cv2.destroyAllWindows()
        print("[DMS] Arrêt — envoi des dernières alertes...")


def draw_hud(cv2, frame, metrics, conditions, last_alert, cam_index) -> None:
    """Panneau d'état à gauche + alertes récentes (3 s) en rouge."""
    labels = [
        ("Yeux ouverts", "FATIGUE_EYES_CLOSED"),
        ("Pas de baillement", "FATIGUE_YAWN"),
        ("Tete droite", "FATIGUE_DROP"),
        ("Regard route", "DISTRACTION"),
        ("Pas de telephone", "PHONE"),
    ]
    cv2.rectangle(frame, (0, 0), (230, 166), (25, 25, 25), -1)
    for i, (label, key) in enumerate(labels):
        y = 24 + i * 24
        color = (0, 200, 80) if not conditions[key] else (0, 0, 220)
        cv2.circle(frame, (16, y - 6), 6, color, -1)
        cv2.putText(frame, label, (30, y), cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                    (220, 220, 220), 1, cv2.LINE_AA)
    if metrics:
        # Valeurs brutes : utiles pour calibrer les seuils dans config.py
        cv2.putText(frame, f"EAR {metrics.ear:.2f} (seuil {metrics.ear_threshold:.2f})",
                    (10, 142), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (160, 160, 160), 1, cv2.LINE_AA)
        cv2.putText(frame, f"MAR {metrics.mar:.2f} P {metrics.pitch:.2f} Y {metrics.yaw:.2f}",
                    (10, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (160, 160, 160), 1, cv2.LINE_AA)
    else:
        cv2.putText(frame, "Aucun visage", (10, 142), cv2.FONT_HERSHEY_SIMPLEX,
                    0.45, (0, 165, 255), 1, cv2.LINE_AA)

    y = 195
    for type_alerte, t in last_alert.items():
        if time.time() - t < 3.0:
            cv2.putText(frame, f"!! {type_alerte}", (10, y), cv2.FONT_HERSHEY_SIMPLEX,
                        0.65, (0, 0, 255), 2, cv2.LINE_AA)
            y += 30
    cv2.putText(frame, f"DMS | CAM-{cam_index} | PC", (frame.shape[1] - 170, 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 255, 100), 1, cv2.LINE_AA)


# ══════════════════════════════════════════════════════════════════════════
# Point d'entrée
# ══════════════════════════════════════════════════════════════════════════

def parse_args():
    p = argparse.ArgumentParser(description="ADAS-DMS Lite — client PC (CAM1)")
    p.add_argument("--simulate", action="store_true",
                   help="envoie des événements factices, sans webcam")
    p.add_argument("--dry-run", action="store_true",
                   help="n'envoie rien : affiche les alertes dans la console")
    p.add_argument("--code", default=config.CONDUCTEUR_CODE, help="code conducteur (ex. C10)")
    p.add_argument("--cam", type=int, default=config.CAMERA_INDEX, help="index de la webcam")
    p.add_argument("--no-preview", action="store_true", help="sans fenêtre de prévisualisation")
    p.add_argument("--interval", type=float, default=5.0,
                   help="(simulation) secondes entre deux événements")
    p.add_argument("--count", type=int, default=0,
                   help="(simulation) nombre d'événements, 0 = infini")
    p.add_argument("--type", dest="only_type", default=None,
                   help="(simulation) un seul type, ex. PHONE")
    return p.parse_args()


def main() -> int:
    args = parse_args()

    if not args.dry_run and not (config.SUPABASE_URL and config.SUPABASE_ANON_KEY):
        print("ERREUR : SUPABASE_URL / SUPABASE_ANON_KEY manquants (voir .env.example).")
        return 2

    sender = SupabaseSender(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, dry_run=args.dry_run)
    gps = GpsSimulator()
    try:
        if args.simulate:
            run_simulation(sender, gps, args.code, args.interval, args.count, args.only_type)
        else:
            run_webcam(sender, gps, args.code, args.cam,
                       preview=config.SHOW_PREVIEW and not args.no_preview)
    except KeyboardInterrupt:
        print("\n[DMS] Interrompu.")
    finally:
        sender.stop()
    return 0


if __name__ == "__main__":
    sys.exit(main())
