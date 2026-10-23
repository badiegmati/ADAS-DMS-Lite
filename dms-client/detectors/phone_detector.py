"""
Détection du téléphone avec YOLOv8n (classe COCO 67) dans un thread dédié,
pour ne pas ralentir la boucle caméra. Une inférence toutes les ~150 ms.
"""

import threading
import time

import cv2

import config

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:  # le client reste utilisable sans détection téléphone
    YOLO_AVAILABLE = False


class PhoneDetector:
    def __init__(self):
        self.detected = False
        self._frame = None
        self._lock = threading.Lock()
        self._running = False
        self._model = None

    def start(self) -> None:
        if not YOLO_AVAILABLE:
            print("[PHONE] ultralytics non installé : détection téléphone désactivée.")
            return
        self._model = YOLO(config.YOLO_MODEL)  # télécharge yolov8n.pt au 1er lancement
        self._running = True
        threading.Thread(target=self._loop, daemon=True, name="phone-yolo").start()

    def submit(self, frame) -> None:
        """Dépose la dernière frame à analyser (la précédente est écrasée)."""
        if not self._running:
            return
        with self._lock:
            self._frame = frame.copy()

    def _loop(self) -> None:
        while self._running:
            with self._lock:
                frame, self._frame = self._frame, None
            if frame is None:
                time.sleep(0.02)
                continue
            small = cv2.resize(frame, (320, 240))
            result = self._model(small, verbose=False, conf=config.PHONE_CONFIDENCE)[0]
            self.detected = any(int(b.cls) == config.PHONE_CLASS_ID for b in result.boxes)
            time.sleep(config.PHONE_INTERVAL_S)

    def stop(self) -> None:
        self._running = False
