package tn.adasdms.lite.dto;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Création / modification d'un conducteur par son gestionnaire (code et mot de passe : voir FleetService). */
public record ConducteurRequest(String codeConducteur, @NotBlank String nom, @NotBlank String prenom,
                                @NotBlank @Email String email, String telephone, String motDePasse,
                                UUID vehiculeId, Boolean actif) {
}
