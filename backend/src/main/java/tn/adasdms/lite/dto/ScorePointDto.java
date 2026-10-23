package tn.adasdms.lite.dto;

import java.time.Instant;

/** Un point de la courbe d'évolution du score. */
public record ScorePointDto(Instant instant, double valeur, String niveau) {
}
