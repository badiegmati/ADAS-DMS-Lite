package tn.adasdms.lite.dto;

import java.time.Instant;
import java.util.UUID;

import tn.adasdms.lite.entity.Vehicule;

public record VehiculeDto(UUID id, String matricule, String marque, String modele, String statut,
                          String conducteurNom, Instant createdAt) {

    public static VehiculeDto of(Vehicule v, String conducteurNom) {
        return new VehiculeDto(v.getId(), v.getMatricule(), v.getMarque(), v.getModele(),
                v.getStatut(), conducteurNom, v.getCreatedAt());
    }
}
