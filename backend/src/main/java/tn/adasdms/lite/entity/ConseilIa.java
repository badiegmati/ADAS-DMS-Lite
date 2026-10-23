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

/** Message généré par Gemini pour un conducteur : type ALERTE ou CONSEIL. */
@Entity
@Table(name = "conseils_ia")
@Getter
@Setter
@NoArgsConstructor
public class ConseilIa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conducteur_id", nullable = false)
    private UUID conducteurId;

    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "contenu", nullable = false, length = 4000)
    private String contenu;

    @Column(name = "score_moment", precision = 5, scale = 2)
    private BigDecimal scoreMoment;

    @Column(name = "modele")
    private String modele;

    @Column(name = "lu", nullable = false)
    private boolean lu = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
