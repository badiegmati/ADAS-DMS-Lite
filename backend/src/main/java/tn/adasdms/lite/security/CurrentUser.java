package tn.adasdms.lite.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import tn.adasdms.lite.exception.ForbiddenException;

/** Accès à l'utilisateur authentifié depuis les contrôleurs et services. */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static CustomUserDetails get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails user) {
            return user;
        }
        throw new ForbiddenException("Authentification requise");
    }
}
