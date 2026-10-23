package tn.adasdms.lite.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import tn.adasdms.lite.entity.ConseilIa;

public interface ConseilIaRepository extends JpaRepository<ConseilIa, Long> {

    List<ConseilIa> findTop20ByConducteurIdOrderByCreatedAtDesc(UUID conducteurId);

    Optional<ConseilIa> findFirstByConducteurIdAndLuFalseOrderByCreatedAtDesc(UUID conducteurId);

    Optional<ConseilIa> findFirstByConducteurIdOrderByCreatedAtDesc(UUID conducteurId);

    boolean existsByConducteurIdAndTypeAndCreatedAtAfter(UUID conducteurId, String type, Instant depuis);

    long countByConducteurIdAndLuFalse(UUID conducteurId);

    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("update ConseilIa c set c.lu = true where c.conducteurId = :id and c.lu = false")
    int marquerTousLus(@Param("id") UUID conducteurId);
}
