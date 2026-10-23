package tn.adasdms.lite.dto;

import jakarta.validation.constraints.NotBlank;

/** Connexion : identifiant = identifiant admin, e-mail gestionnaire, e-mail ou code conducteur. */
public record LoginRequest(@NotBlank String identifiant, @NotBlank String motDePasse) {
}
