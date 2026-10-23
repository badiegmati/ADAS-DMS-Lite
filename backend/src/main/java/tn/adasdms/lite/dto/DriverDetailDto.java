package tn.adasdms.lite.dto;

import java.util.List;

/** Détail d'un conducteur vu par son gestionnaire. */
public record DriverDetailDto(ConducteurDto conducteur, PageDto<AlerteDto> alertes,
                              List<ScorePointDto> historique, List<AlerteDto> carte,
                              List<ConseilDto> conseils) {
}
