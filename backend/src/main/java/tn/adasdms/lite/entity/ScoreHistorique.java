package tn.adasdms.lite.entity;

import java.math.BigDecimal;
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

/** Un point de la courbe d'évolution du score (ajouté par le trigger à chaque alerte). */
@Entity
@Table(name = "scores_historique")
@Getter
@Setter
@NoArgsConstructor
public class ScoreHistorique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conducteur_id", nullable = false)
    private UUID conducteurId;

    @Column(name = "valeur", nullable = false, precision = 5, scale = 2)
    private BigDecimal valeur;

    @Column(name = "niveau", nullable = false)
    private String niveau;

    @Column(name = "calcule_le", nullable = false)
    private Instant calculeLe = Instant.now();
}
