package tn.adasdms.lite.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import tn.adasdms.lite.entity.Message;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConducteurIdAndGestionnaireIdOrderByCreatedAtAsc(UUID conducteurId, UUID gestionnaireId);

    long countByConducteurIdAndExpediteurRoleAndLuFalse(UUID conducteurId, String expediteurRole);

    /** Marque comme lus les messages envoyés par l'autre partie. */
    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("update Message m set m.lu = true "
         + "where m.conducteurId = :cid and m.expediteurRole = :role and m.lu = false")
    int marquerLus(@Param("cid") UUID conducteurId, @Param("role") String expediteurRole);
}
