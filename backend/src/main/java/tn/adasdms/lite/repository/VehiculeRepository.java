package tn.adasdms.lite.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import tn.adasdms.lite.entity.Vehicule;

public interface VehiculeRepository extends JpaRepository<Vehicule, UUID> {
    List<Vehicule> findByGestionnaireIdOrderByMatriculeAsc(UUID gestionnaireId);

    boolean existsByMatriculeIgnoreCase(String matricule);

    long countByGestionnaireId(UUID gestionnaireId);
}
