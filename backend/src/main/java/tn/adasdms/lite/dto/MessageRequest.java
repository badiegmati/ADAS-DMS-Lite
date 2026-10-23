package tn.adasdms.lite.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** conducteurId est obligatoire pour un gestionnaire, ignoré pour un conducteur. */
public record MessageRequest(UUID conducteurId, @NotBlank @Size(max = 2000) String contenu) {
}
