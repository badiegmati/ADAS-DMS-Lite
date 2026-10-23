package tn.adasdms.lite.dto;

import java.time.Instant;
import java.util.UUID;

public record ScoreDto(UUID conducteurId, double valeur, String niveau, long nbAlertes24h, Instant derniereMaj) {
}
