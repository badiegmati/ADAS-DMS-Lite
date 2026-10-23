package tn.adasdms.lite.service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import tn.adasdms.lite.dto.ScoreDto;
import tn.adasdms.lite.entity.Conducteur;
import tn.adasdms.lite.repository.ConducteurRepository;
import tn.adasdms.lite.repository.ConseilIaRepository;

/**
 * Toutes les 15 secondes :
 *  1. ALERTE  : score >= 75 et pas d'alerte IA depuis 30 min  -> message d'alerte Gemini ;
 *  2. CONSEIL : une fois par jour si l'historique 7 j est mauvais -> conseils personnalisés.
 */
@Component
@ConditionalOnProperty(name = "app.scheduler.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class ConseilScheduler {

    private static final Logger log = LoggerFactory.getLogger(ConseilScheduler.class);

    private final ConducteurRepository conducteurs;
    private final ConseilIaRepository conseils;
    private final ScoreService scores;
    private final ConseilService conseilService;

    @Scheduled(fixedDelay = 15_000, initialDelay = 20_000)
    public void verifier() {
        for (Conducteur c : conducteurs.findByActifTrue()) {
            try {
                traiter(c);
            } catch (Exception e) {
                log.warn("Conseils IA : échec pour {} : {}", c.getCodeConducteur(), e.getMessage());
            }
        }
    }

    void traiter(Conducteur c) {
        ScoreDto score = scores.courant(c.getId());
        Instant maintenant = Instant.now();

        if (score.valeur() >= Niveau.SEUIL_CRITIQUE
                && !conseils.existsByConducteurIdAndTypeAndCreatedAtAfter(
                        c.getId(), "ALERTE", maintenant.minus(Duration.ofMinutes(30)))) {
            log.info("Score critique ({}) pour {} : génération du message d'alerte",
                    Math.round(score.valeur()), c.getCodeConducteur());
            conseilService.genererAlerte(c, score);
        }

        Instant debutJour = LocalDate.now(ConseilService.ZONE).atStartOfDay(ConseilService.ZONE).toInstant();
        if (!conseils.existsByConducteurIdAndTypeAndCreatedAtAfter(c.getId(), "CONSEIL", debutJour)
                && conseilService.historiqueMauvais(c.getId())) {
            log.info("Historique 7 j mauvais pour {} : génération des conseils", c.getCodeConducteur());
            conseilService.genererConseils(c, score);
        }
    }
}
