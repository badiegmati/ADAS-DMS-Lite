package tn.adasdms.lite.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Score courant stocké par le trigger SQL (une ligne par conducteur). */
@Entity
@Table(name = "scores_risque")
@Getter
@Setter
@NoArgsConstructor
public class ScoreRisque {

    @Id
    @Column(name = "conducteur_id")
    private UUID conducteurId;

    @Column(name = "valeur", nullable = false, precision = 5, scale = 2)
    private BigDecimal valeur;

    @Column(name = "niveau", nullable = false)
    private String niveau;

    @Column(name = "nb_alertes_24h", nullable = false)
    private int nbAlertes24h;

    @Column(name = "derniere_maj", nullable = false)
    private Instant derniereMaj;
}
