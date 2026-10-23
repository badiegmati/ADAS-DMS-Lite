package tn.adasdms.lite.repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import tn.adasdms.lite.entity.ScoreHistorique;

public interface ScoreHistoriqueRepository extends JpaRepository<ScoreHistorique, Long> {

    List<ScoreHistorique> findByConducteurIdAndCalculeLeAfterOrderByCalculeLeAsc(UUID conducteurId, Instant depuis);

    @Query("select avg(s.valeur) from ScoreHistorique s where s.conducteurId = :id and s.calculeLe > :depuis")
    Double moyenneDepuis(@Param("id") UUID conducteurId, @Param("depuis") Instant depuis);
}
