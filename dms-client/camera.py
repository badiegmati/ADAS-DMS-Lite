"""Accès à la webcam : ouverture, miroir horizontal, lecture d'une frame."""

import sys

import cv2


class Camera:
    """Petite enveloppe autour de cv2.VideoCapture."""

    def __init__(self, index: int = 0, width: int = 640, height: int = 480, fps: int = 30):
        self.index = index
        # CAP_DSHOW ouvre la webcam beaucoup plus vite sous Windows
        backend = cv2.CAP_DSHOW if sys.platform == "win32" else cv2.CAP_ANY
        self._cap = cv2.VideoCapture(index, backend)
        self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
        self._cap.set(cv2.CAP_PROP_FPS, fps)

    def is_opened(self) -> bool:
        return self._cap.isOpened()

    def read(self):
        """Retourne la frame en miroir (BGR) ou None si la lecture échoue."""
        ok, frame = self._cap.read()
        if not ok:
            return None
        return cv2.flip(frame, 1)

    def release(self) -> None:
        self._cap.release()
