package tn.adasdms.lite.dto;

import java.time.Instant;
import java.util.UUID;

import tn.adasdms.lite.entity.Gestionnaire;

public record GestionnaireDto(UUID id, String entreprise, String email, boolean actif,
                              long nbConducteurs, long nbVehicules, Instant createdAt) {

    public static GestionnaireDto of(Gestionnaire g, long nbConducteurs, long nbVehicules) {
        return new GestionnaireDto(g.getId(), g.getEntreprise(), g.getEmail(), g.isActif(),
                nbConducteurs, nbVehicules, g.getCreatedAt());
    }
}
