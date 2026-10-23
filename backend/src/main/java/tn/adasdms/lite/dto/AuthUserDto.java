package tn.adasdms.lite.dto;

import java.util.UUID;

/** Utilisateur connecté (réponse de /login et /me). */
public record AuthUserDto(UUID id, String role, String nom) {
}
