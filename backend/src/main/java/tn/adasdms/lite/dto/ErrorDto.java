package tn.adasdms.lite.dto;

import java.time.Instant;

/** Format uniforme des erreurs de l'API. */
public record ErrorDto(String message, int status, Instant timestamp) {
}
