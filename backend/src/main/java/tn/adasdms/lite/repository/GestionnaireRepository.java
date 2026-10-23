package tn.adasdms.lite.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import tn.adasdms.lite.entity.Gestionnaire;

public interface GestionnaireRepository extends JpaRepository<Gestionnaire, UUID> {
    Optional<Gestionnaire> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEntrepriseIgnoreCase(String entreprise);

    List<Gestionnaire> findAllByOrderByEntrepriseAsc();
}
