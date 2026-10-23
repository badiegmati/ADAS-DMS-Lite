package tn.adasdms.lite.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;
import tn.adasdms.lite.dto.ConseilDto;
import tn.adasdms.lite.dto.ScoreDto;
import tn.adasdms.lite.entity.Alerte;
import tn.adasdms.lite.entity.ConseilIa;
import tn.adasdms.lite.entity.Conducteur;
import tn.adasdms.lite.repository.AlerteRepository;
import tn.adasdms.lite.repository.ConseilIaRepository;
import tn.adasdms.lite.repository.ScoreHistoriqueRepository;

/**
 * Messages IA destinés au conducteur :
 *  - ALERTE  : score >= 75, message court et direct ;
 *  - CONSEIL : historique des 7 jours mauvais, 3 à 5 conseils personnalisés.
 */
@Service
@RequiredArgsConstructor
public class ConseilService {

    static final ZoneId ZONE = ZoneId.of("Africa/Tunis");
    private static final DateTimeFormatter HEURE = DateTimeFormatter.ofPattern("HH:mm");

    private static final Map<String, String> LIBELLES = Map.of(
            "DISTRACTION", "regard détourné de la route",
            "FATIGUE_YAWN", "bâillements",
            "FATIGUE_DROP", "tête qui tombe",
            "FATIGUE_EYES_DROWSY", "yeux mi-clos (somnolence)",
            "FATIGUE_EYES_CLOSED", "yeux fermés plus de 2 secondes",
            "PHONE", "téléphone au volant");

    private final ConseilIaRepository conseils;
    private final AlerteRepository alertes;
    private final ScoreHistoriqueRepository historique;
    private final ScoreService scores;
    private final GeminiService gemini;

    // ── Lecture ───────────────────────────────────────────────────────────
    public List<ConseilDto> lister(UUID conducteurId) {
        return conseils.findTop20ByConducteurIdOrderByCreatedAtDesc(conducteurId).stream()
                .map(ConseilDto::from).toList();
    }

    public void marquerLus(UUID conducteurId) {
        conseils.marquerTousLus(conducteurId);
    }

    // ── Règle « historique mauvais » : score moyen 7 j >= 50 ou >= 3 événements critiques ──
    public boolean historiqueMauvais(UUID conducteurId) {
        Instant depuis = Instant.now().minus(Duration.ofDays(7));
        Double moyenne = historique.moyenneDepuis(conducteurId, depuis);
        long critiques = alertes.countByConducteurIdAndCritiqueTrueAndHorodatageAfter(conducteurId, depuis);
        return (moyenne != null && moyenne >= 50.0) || critiques >= 3;
    }

    // ── Génération ────────────────────────────────────────────────────────
    public ConseilDto genererAlerte(Conducteur c, ScoreDto score) {
        List<Alerte> recentes = alertes.findTop10ByConducteurIdOrderByHorodatageDesc(c.getId());
        StringBuilder p = new StringBuilder();
        p.append("Tu es l'assistant sécurité d'une application de supervision de conducteurs.\n");
        p.append("Le conducteur ").append(c.getPrenom()).append(" est en situation de risque CRITIQUE : ");
        p.append("score de risque ").append(Math.round(score.valeur())).append(" sur 100.\n");
        p.append("Dernières alertes détectées par la caméra :\n");
        for (Alerte a : recentes) {
            p.append("- ").append(libelle(a.getTypeAlerte())).append(" à ")
                    .append(a.getHorodatage().atZone(ZONE).format(HEURE)).append('\n');
        }
        p.append("Écris un message d'alerte court, direct et bienveillant, en français, ");
        p.append("3 phrases maximum, adressé directement au conducteur. ");
        p.append("S'il y a des signes de fatigue, demande-lui de s'arrêter en sécurité et de se reposer. ");
        p.append("Pas de titre, pas de mise en forme.");
        String repli = c.getPrenom() + ", votre niveau de risque est critique (" + Math.round(score.valeur())
                + "/100). Arrêtez-vous dès que possible dans un endroit sûr et reposez-vous avant de reprendre la route.";
        return enregistrer(c.getId(), "ALERTE", gemini.generer(p.toString(), repli), score.valeur());
    }

    public ConseilDto genererConseils(Conducteur c, ScoreDto score) {
        Instant depuis = Instant.now().minus(Duration.ofDays(7));
        List<Alerte> sur7j = alertes.findByConducteurIdAndHorodatageAfterOrderByHorodatageDesc(c.getId(), depuis);
        Map<String, Long> parType = sur7j.stream()
                .collect(Collectors.groupingBy(Alerte::getTypeAlerte, TreeMap::new, Collectors.counting()));
        Map<Integer, Long> parHeure = sur7j.stream()
                .collect(Collectors.groupingBy(a -> a.getHorodatage().atZone(ZONE).getHour(), Collectors.counting()));
        String heuresARisque = parHeure.entrySet().stream()
                .sorted(Map.Entry.<Integer, Long>comparingByValue().reversed())
                .limit(3)
                .map(e -> e.getKey() + "h (" + e.getValue() + " alertes)")
                .collect(Collectors.joining(", "));
        long critiques = sur7j.stream().filter(Alerte::isCritique).count();
        Double moyenne = historique.moyenneDepuis(c.getId(), depuis);

        StringBuilder p = new StringBuilder();
        p.append("Tu es un coach de conduite sûre dans une application de supervision de conducteurs.\n");
        p.append("Résumé des 7 derniers jours du conducteur ").append(c.getPrenom()).append(" :\n");
        p.append("- score de risque actuel : ").append(Math.round(score.valeur())).append("/100\n");
        p.append("- score moyen sur 7 jours : ").append(moyenne == null ? "inconnu" : Math.round(moyenne) + "/100").append('\n');
        p.append("- alertes : ").append(sur7j.size()).append(" dont ").append(critiques).append(" critiques\n");
        Map<String, Long> detail = new LinkedHashMap<>();
        parType.forEach((type, n) -> detail.put(libelle(type), n));
        p.append("- répartition : ").append(detail.isEmpty() ? "aucune alerte" : detail.toString()).append('\n');
        p.append("- heures les plus à risque : ").append(heuresARisque.isEmpty() ? "aucune" : heuresARisque).append('\n');
        p.append("Donne 3 à 5 conseils concrets et personnalisés pour réduire ces comportements à risque, ");
        p.append("en français, sous forme de liste numérotée, une phrase par conseil, ton encourageant. ");
        p.append("Pas d'introduction ni de conclusion.");
        String repli = "1. Faites une pause de 15 minutes toutes les 2 heures de conduite.\n"
                + "2. Évitez de conduire aux heures où vous êtes habituellement fatigué.\n"
                + "3. Rangez votre téléphone hors de portée avant de démarrer.\n"
                + "4. Gardez le regard sur la route et utilisez vos rétroviseurs sans tourner la tête longtemps.\n"
                + "5. Hydratez-vous et aérez l'habitacle pour rester vigilant.";
        return enregistrer(c.getId(), "CONSEIL", gemini.generer(p.toString(), repli), score.valeur());
    }

    /** Demande manuelle du conducteur : limitée à une fois toutes les 6 heures. */
    public ConseilDto genererManuel(Conducteur c) {
        Instant limite = Instant.now().minus(Duration.ofHours(6));
        if (conseils.existsByConducteurIdAndTypeAndCreatedAtAfter(c.getId(), "CONSEIL", limite)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Des conseils ont déjà été générés récemment (une fois toutes les 6 heures)");
        }
        return genererConseils(c, scores.courant(c.getId()));
    }

    // ── Interne ───────────────────────────────────────────────────────────
    private ConseilDto enregistrer(UUID conducteurId, String type, GeminiResult r, double score) {
        ConseilIa e = new ConseilIa();
        e.setConducteurId(conducteurId);
        e.setType(type);
        e.setContenu(r.texte().length() > 4000 ? r.texte().substring(0, 4000) : r.texte());
        e.setScoreMoment(BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP));
        e.setModele(r.modele());
        return ConseilDto.from(conseils.save(e));
    }

    private static String libelle(String type) {
        return LIBELLES.getOrDefault(type, type);
    }
}
