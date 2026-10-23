package tn.adasdms.lite.security;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/** Utilisateur authentifié par le JWT : identifiant, rôle (ADMIN, GESTIONNAIRE, CONDUCTEUR) et nom. */
public class CustomUserDetails implements UserDetails {

    public static final String ADMIN = "ADMIN";
    public static final String GESTIONNAIRE = "GESTIONNAIRE";
    public static final String CONDUCTEUR = "CONDUCTEUR";

    private final UUID id;
    private final String role;
    private final String nom;

    public CustomUserDetails(UUID id, String role, String nom) {
        this.id = id;
        this.role = role;
        this.nom = nom;
    }

    public UUID getId() {
        return id;
    }

    public String getRole() {
        return role;
    }

    public String getNom() {
        return nom;
    }

    public boolean isConducteur() {
        return CONDUCTEUR.equals(role);
    }

    public boolean isGestionnaire() {
        return GESTIONNAIRE.equals(role);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return id.toString();
    }

    // Le compte actif/inactif est vérifié une seule fois, au login (voir AuthController).
    // Le JWT est stateless : on ne revérifie pas l'état en base à chaque requête,
    // donc ces 4 méthodes renvoient toujours true.
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}