package tn.adasdms.lite.dto;

import jakarta.validation.constraints.Email;

/** Profil conducteur : seuls l'e-mail, le téléphone et le mot de passe sont modifiables. */
public record ProfilRequest(@Email String email, String telephone, String motDePasse) {
}
