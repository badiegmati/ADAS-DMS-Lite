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

@Entity
@Table(name = "vehicules")
@Getter
@Setter
@NoArgsConstructor
public class Vehicule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "matricule", nullable = false, unique = true)
    private String matricule;

    @Column(name = "marque")
    private String marque;

    @Column(name = "modele")
    private String modele;

    /** ACTIF, INACTIF ou MAINTENANCE. */
    @Column(name = "statut", nullable = false)
    private String statut = "ACTIF";

    @Column(name = "gestionnaire_id", nullable = false)
    private UUID gestionnaireId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
