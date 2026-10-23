package tn.adasdms.lite.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Message de la conversation gestionnaire ↔ conducteur. */
@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conducteur_id", nullable = false)
    private UUID conducteurId;

    @Column(name = "gestionnaire_id", nullable = false)
    private UUID gestionnaireId;

    /** GESTIONNAIRE ou CONDUCTEUR. */
    @Column(name = "expediteur_role", nullable = false)
    private String expediteurRole;

    @Column(name = "contenu", nullable = false, length = 4000)
    private String contenu;

    @Column(name = "lu", nullable = false)
    private boolean lu = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
