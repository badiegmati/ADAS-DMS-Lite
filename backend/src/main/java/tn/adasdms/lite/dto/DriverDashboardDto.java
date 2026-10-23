package tn.adasdms.lite.dto;

import java.util.List;

/** Tableau de bord du conducteur. */
public record DriverDashboardDto(ConducteurDto profil, ScoreDto score, long alertes24h, long critiques24h,
                                 long conseilsNonLus, long messagesNonLus,
                                 List<AlerteDto> dernieresAlertes, ConseilDto conseilEnAvant) {
}
