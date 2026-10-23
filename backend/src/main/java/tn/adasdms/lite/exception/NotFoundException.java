package tn.adasdms.lite.exception;

/** Ressource introuvable (HTTP 404). */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
