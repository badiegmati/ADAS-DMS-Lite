package tn.adasdms.lite.exception;

/** Accès à une ressource d'un autre utilisateur (HTTP 403). */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
