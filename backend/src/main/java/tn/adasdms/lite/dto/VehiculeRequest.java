package tn.adasdms.lite.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VehiculeRequest(@NotBlank String matricule, String marque, String modele,
                              @Pattern(regexp = "ACTIF|INACTIF|MAINTENANCE",
                                       message = "doit valoir ACTIF, INACTIF ou MAINTENANCE") String statut) {
}
