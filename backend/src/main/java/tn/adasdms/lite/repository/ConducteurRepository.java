package tn.adasdms.lite.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import tn.adasdms.lite.entity.Conducteur;

public interface ConducteurRepository extends JpaRepository<Conducteur, UUID> {
    Optional<Conducteur> findByEmailIgnoreCase(String email);

    Optional<Conducteur> findByCodeConducteurIgnoreCase(String code);

    Optional<Conducteur> findByVehiculeId(UUID vehiculeId);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByCodeConducteurIgnoreCase(String code);

    List<Conducteur> findByGestionnaireIdOrderByNomAsc(UUID gestionnaireId);

    List<Conducteur> findByActifTrue();

    long countByGestionnaireId(UUID gestionnaireId);
}
