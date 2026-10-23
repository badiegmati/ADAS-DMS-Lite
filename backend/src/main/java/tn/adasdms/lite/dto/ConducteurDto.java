package tn.adasdms.lite.dto;

import java.time.Instant;
import java.util.UUID;

import tn.adasdms.lite.entity.Conducteur;

/** Conducteur avec son véhicule et son score de risque courant (jamais de mot de passe). */
public record ConducteurDto(UUID id, String codeConducteur, String nom, String prenom, String email,
                            String telephone, boolean actif, UUID vehiculeId, String vehiculeMatricule,
                            ScoreDto score, Instant createdAt) {

    public static ConducteurDto of(Conducteur c, String vehiculeMatricule, ScoreDto score) {
        return new ConducteurDto(c.getId(), c.getCodeConducteur(), c.getNom(), c.getPrenom(), c.getEmail(),
                c.getTelephone(), c.isActif(), c.getVehiculeId(), vehiculeMatricule, score, c.getCreatedAt());
    }
}
