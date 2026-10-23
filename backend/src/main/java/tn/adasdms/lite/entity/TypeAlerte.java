package tn.adasdms.lite.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Référentiel des types d'alerte : pénalité (severite) et caractère critique. */
@Entity
@Table(name = "types_alerte")
@Getter
@Setter
@NoArgsConstructor
public class TypeAlerte {

    @Id
    @Column(name = "code")
    private String code;

    @Column(name = "libelle", nullable = false)
    private String libelle;

    @Column(name = "severite", nullable = false)
    private int severite;

    @Column(name = "critique", nullable = false)
    private boolean critique;
}
