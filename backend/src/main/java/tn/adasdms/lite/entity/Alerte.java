package tn.adasdms.lite.entity;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Alerte écrite par le client PC directement dans Supabase.
 * L'API ne fait que la lire (entité immuable).
 */
@Entity
@Immutable
@Table(name = "alertes")
@Getter
@Setter
@NoArgsConstructor
public class Alerte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_uid", nullable = false, unique = true)
    private UUID eventUid = UUID.randomUUID();

    @Column(name = "conducteur_code", nullable = false)
    private String conducteurCode;

    @Column(name = "conducteur_id")
    private UUID conducteurId;

    @Column(name = "type_alerte", nullable = false)
    private String typeAlerte;

    @Column(name = "severite", nullable = false)
    private int severite;

    @Column(name = "critique", nullable = false)
    private boolean critique;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "horodatage", nullable = false)
    private Instant horodatage = Instant.now();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}
