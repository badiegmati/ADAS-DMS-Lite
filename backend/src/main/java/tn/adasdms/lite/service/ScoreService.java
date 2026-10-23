package tn.adasdms.lite.service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import tn.adasdms.lite.dto.ScoreDto;
import tn.adasdms.lite.dto.ScorePointDto;
import tn.adasdms.lite.entity.ScoreHistorique;
import tn.adasdms.lite.repository.AlerteRepository;
import tn.adasdms.lite.repository.ScoreHistoriqueRepository;

/**
 * Lecture du score de risque.
 * Le calcul est fait par la fonction SQL calculer_score() (décroissance exponentielle dans le temps) :
 * l'appeler à chaque lecture garantit un score à jour même sans nouvelle alerte.
 * Le résultat est mis en cache 5 secondes au plus.
 */
@Service
public class ScoreService {

    static final long TTL_MS = 5_000;

    private record Cached(ScoreDto score, long at) {
    }

    private final EntityManager em;
    private final AlerteRepository alertes;
    private final ScoreHistoriqueRepository historique;
    private final LongSupplier clock;
    private final Map<UUID, Cached> cache = new ConcurrentHashMap<>();

    @Autowired
    public ScoreService(EntityManager em, AlerteRepository alertes, ScoreHistoriqueRepository historique) {
        this(em, alertes, historique, System::currentTimeMillis);
    }

    /** Constructeur de test : horloge injectable. */
    ScoreService(EntityManager em, AlerteRepository alertes, ScoreHistoriqueRepository historique,
                 LongSupplier clock) {
        this.em = em;
        this.alertes = alertes;
        this.historique = historique;
        this.clock = clock;
    }

    /** Score courant d'un conducteur (0 à 100) avec son niveau. */
    @Transactional(readOnly = true)
    public ScoreDto courant(UUID conducteurId) {
        long now = clock.getAsLong();
        Cached c = cache.get(conducteurId);
        if (c != null && now - c.at() < TTL_MS) {
            return c.score();
        }
        Object r = em.createNativeQuery("select calculer_score(cast(:id as uuid))")
                .setParameter("id", conducteurId)
                .getSingleResult();
        double valeur = r == null ? 0.0 : ((Number) r).doubleValue();
        Instant maintenant = Instant.ofEpochMilli(now);
        long nb24h = alertes.countByConducteurIdAndHorodatageAfter(conducteurId, maintenant.minus(Duration.ofHours(24)));
        ScoreDto dto = new ScoreDto(conducteurId, valeur, Niveau.of(valeur), nb24h, maintenant);
        cache.put(conducteurId, new Cached(dto, now));
        return dto;
    }

    /** Courbe d'évolution : plage = 1h, 6h, 24h (défaut) ou 7j. Se termine par le score actuel. */
    @Transactional(readOnly = true)
    public List<ScorePointDto> historique(UUID conducteurId, String plage) {
        Duration d = switch (plage == null ? "24h" : plage) {
            case "1h" -> Duration.ofHours(1);
            case "6h" -> Duration.ofHours(6);
            case "7j" -> Duration.ofDays(7);
            default -> Duration.ofHours(24);
        };
        Instant depuis = Instant.ofEpochMilli(clock.getAsLong()).minus(d);
        List<ScorePointDto> points = new ArrayList<>();
        for (ScoreHistorique h : historique
                .findByConducteurIdAndCalculeLeAfterOrderByCalculeLeAsc(conducteurId, depuis)) {
            BigDecimal v = h.getValeur();
            points.add(new ScorePointDto(h.getCalculeLe(), v.doubleValue(), h.getNiveau()));
        }
        ScoreDto actuel = courant(conducteurId);
        points.add(new ScorePointDto(actuel.derniereMaj(), actuel.valeur(), actuel.niveau()));
        return points;
    }
}
