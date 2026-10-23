package tn.adasdms.lite.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Création / modification d'un gestionnaire (mot de passe obligatoire à la création uniquement). */
public record GestionnaireRequest(@NotBlank String entreprise, @NotBlank @Email String email,
                                  String motDePasse, Boolean actif) {
}
