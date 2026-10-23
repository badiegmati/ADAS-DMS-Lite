package tn.adasdms.lite.dto;

import java.util.List;
import java.util.Map;

/** Tableau de bord du gestionnaire : KPI, répartition des niveaux, conducteurs à risque. */
public record GestionnaireDashboardDto(Kpi kpi, Map<String, Long> repartition,
                                       List<ConducteurDto> topRisque, List<ConducteurDto> conducteurs) {

    public record Kpi(long conducteursActifs, long vehicules, double scoreMoyen, long conducteursCritiques) {
    }
}
