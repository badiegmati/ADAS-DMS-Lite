package tn.adasdms.lite.repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import tn.adasdms.lite.entity.Alerte;

public interface AlerteRepository extends JpaRepository<Alerte, Long> {

    Page<Alerte> findByConducteurIdOrderByHorodatageDesc(UUID conducteurId, Pageable pageable);

    Page<Alerte> findByConducteurIdAndTypeAlerteInOrderByHorodatageDesc(
            UUID conducteurId, Collection<String> types, Pageable pageable);

    List<Alerte> findTop10ByConducteurIdOrderByHorodatageDesc(UUID conducteurId);

    List<Alerte> findTop100ByConducteurIdOrderByHorodatageDesc(UUID conducteurId);

    List<Alerte> findByConducteurIdAndHorodatageAfterOrderByHorodatageDesc(UUID conducteurId, Instant depuis);

    long countByConducteurIdAndHorodatageAfter(UUID conducteurId, Instant depuis);

    long countByConducteurIdAndCritiqueTrueAndHorodatageAfter(UUID conducteurId, Instant depuis);

    long countByHorodatageAfter(Instant depuis);
}
