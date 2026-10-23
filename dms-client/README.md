# dms-client — Client PC (CAM1) d'ADAS-DMS Lite

Webcam du PC → détection DMS (MediaPipe + YOLOv8n) → alertes envoyées
directement dans Supabase (table `alertes`). Le score de risque est calculé
automatiquement par les triggers SQL de `supabase/schema.sql`.

## Installation (cmd Windows, Python 3.11)

    cd dms-client
    py -3.11 -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt

Le fichier `.env` est déjà rempli (copie de `.env.example`). Ne le publie
jamais sur GitHub (il est dans le .gitignore du projet).

## Lancement

    python main.py --simulate --count 6 --interval 3     # test sans webcam
    python main.py --simulate --type PHONE --count 1     # une alerte critique
    python main.py --dry-run                              # webcam, sans envoi
    python main.py                                        # webcam + envoi Supabase
    python main.py --cam 1 --no-preview --code C10        # options

ESC (ou Ctrl+C) pour arrêter. Au premier lancement, `yolov8n.pt` est
téléchargé automatiquement (connexion Internet requise).

## Vérifier dans Supabase (SQL Editor)

    select type_alerte, severite, critique, latitude, longitude, horodatage
      from alertes order by id desc limit 10;
    select * from scores_risque;
    select * from scores_historique order by id desc limit 10;

## Tests unitaires

    python -m pytest

## Calibrage des seuils

Les seuils sont dans `config.py`. La fenêtre de prévisualisation affiche
EAR, MAR, P (pitch) et Y (yaw) en direct : compare-les à ton visage au repos
et ajuste `MAR_THRESHOLD`, `PITCH_DROP_THRESHOLD`, `YAW_*_THRESHOLD` si un
événement se déclenche trop souvent.
