package tn.adasdms.lite.service;

/** Niveaux de risque : FAIBLE [0;25[, MODERE [25;50[, ELEVE [50;75[, CRITIQUE [75;100]. */
public final class Niveau {

    public static final String FAIBLE = "FAIBLE";
    public static final String MODERE = "MODERE";
    public static final String ELEVE = "ELEVE";
    public static final String CRITIQUE = "CRITIQUE";

    /** Seuil à partir duquel un conducteur est considéré en danger (alerte IA). */
    public static final double SEUIL_CRITIQUE = 75.0;

    private Niveau() {
    }

    public static String of(double score) {
        if (score < 25) {
            return FAIBLE;
        }
        if (score < 50) {
            return MODERE;
        }
        if (score < SEUIL_CRITIQUE) {
            return ELEVE;
        }
        return CRITIQUE;
    }
}
