package tn.adasdms.lite.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import tn.adasdms.lite.dto.ScoreDto;
import tn.adasdms.lite.dto.ScorePointDto;
import tn.adasdms.lite.entity.ScoreHistorique;
import tn.adasdms.lite.repository.AlerteRepository;
import tn.adasdms.lite.repository.ScoreHistoriqueRepository;

class ScoreServiceTest {

    private final EntityManager em = mock(EntityManager.class);
    private final Query query = mock(Query.class);
    private final AlerteRepository alertes = mock(AlerteRepository.class);
    private final ScoreHistoriqueRepository historique = mock(ScoreHistoriqueRepository.class);
    private final long[] maintenant = {1_700_000_000_000L};
    private final UUID id = UUID.randomUUID();
    private ScoreService service;

    @BeforeEach
    void init() {
        when(em.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(eq("id"), any())).thenReturn(query);
        when(query.getSingleResult()).thenReturn(new BigDecimal("42.50"));
        when(alertes.countByConducteurIdAndHorodatageAfter(eq(id), any())).thenReturn(3L);
        service = new ScoreService(em, alertes, historique, () -> maintenant[0]);
    }

    @Test
    void niveauxRespectentLesSeuilsDuProjet() {
        assertEquals("FAIBLE", Niveau.of(0));
        assertEquals("FAIBLE", Niveau.of(24.99));
        assertEquals("MODERE", Niveau.of(25));
        assertEquals("ELEVE", Niveau.of(50));
        assertEquals("ELEVE", Niveau.of(74.99));
        assertEquals("CRITIQUE", Niveau.of(75));
        assertEquals("CRITIQUE", Niveau.of(100));
    }

    @Test
    void courantLitLaFonctionSqlEtCalculeLeNiveau() {
        ScoreDto s = service.courant(id);
        assertEquals(42.5, s.valeur());
        assertEquals("MODERE", s.niveau());
        assertEquals(3L, s.nbAlertes24h());
    }

    @Test
    void leResultatEstMisEnCache5Secondes() {
        service.courant(id);
        maintenant[0] += 4_000;
        service.courant(id);
        verify(query, times(1)).getSingleResult();

        maintenant[0] += 1_500;     // 5,5 s après le premier calcul
        service.courant(id);
        verify(query, times(2)).getSingleResult();
    }

    @Test
    void lHistoriqueSeTermineParLeScoreActuel() {
        ScoreHistorique h1 = point("10.00", "FAIBLE");
        ScoreHistorique h2 = point("80.00", "CRITIQUE");
        when(historique.findByConducteurIdAndCalculeLeAfterOrderByCalculeLeAsc(eq(id), any()))
                .thenReturn(List.of(h1, h2));

        List<ScorePointDto> points = service.historique(id, "6h");

        assertEquals(3, points.size());
        assertEquals(80.0, points.get(1).valeur());
        assertEquals(42.5, points.get(2).valeur());
    }

    private ScoreHistorique point(String valeur, String niveau) {
        ScoreHistorique h = new ScoreHistorique();
        h.setConducteurId(id);
        h.setValeur(new BigDecimal(valeur));
        h.setNiveau(niveau);
        h.setCalculeLe(Instant.ofEpochMilli(maintenant[0] - 60_000));
        return h;
    }
}
