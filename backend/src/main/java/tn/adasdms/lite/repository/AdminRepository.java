package tn.adasdms.lite.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import tn.adasdms.lite.entity.Admin;

public interface AdminRepository extends JpaRepository<Admin, UUID> {
    Optional<Admin> findByIdentifiant(String identifiant);

    boolean existsByIdentifiant(String identifiant);
}
