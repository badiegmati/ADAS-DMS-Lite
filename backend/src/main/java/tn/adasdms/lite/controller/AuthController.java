package tn.adasdms.lite.controller;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import tn.adasdms.lite.dto.AuthUserDto;
import tn.adasdms.lite.dto.LoginRequest;
import tn.adasdms.lite.entity.Admin;
import tn.adasdms.lite.entity.Conducteur;
import tn.adasdms.lite.entity.Gestionnaire;
import tn.adasdms.lite.repository.AdminRepository;
import tn.adasdms.lite.repository.ConducteurRepository;
import tn.adasdms.lite.repository.GestionnaireRepository;
import tn.adasdms.lite.security.CurrentUser;
import tn.adasdms.lite.security.CustomUserDetails;
import tn.adasdms.lite.security.JwtUtils;

/** Connexion des trois rôles : le JWT est déposé dans un cookie httpOnly (SameSite=Lax). */
@RestController
@RequestMapping("/api")
public class AuthController {

    private static final String MSG_INVALIDE = "Identifiants invalides";

    private final AdminRepository admins;
    private final GestionnaireRepository gestionnaires;
    private final ConducteurRepository conducteurs;
    private final PasswordEncoder encoder;
    private final JwtUtils jwt;
private final String cookieName;
private final boolean cookieSecure;
private final String cookieSameSite;   // ← nouveau champ

public AuthController(AdminRepository admins, GestionnaireRepository gestionnaires,
                      ConducteurRepository conducteurs, PasswordEncoder encoder, JwtUtils jwt,
                      @Value("${app.cookie.name:token}") String cookieName,
                      @Value("${app.cookie.secure:false}") boolean cookieSecure,
                      @Value("${app.cookie.same-site:Lax}") String cookieSameSite) {  // ← nouveau paramètre
    this.admins = admins;
    this.gestionnaires = gestionnaires;
    this.conducteurs = conducteurs;
    this.encoder = encoder;
    this.jwt = jwt;
    this.cookieName = cookieName;
    this.cookieSecure = cookieSecure;
    this.cookieSameSite = cookieSameSite;  // ← nouvelle affectation
}

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }

    @PostMapping("/auth/admin/login")
    public AuthUserDto loginAdmin(@Valid @RequestBody LoginRequest r, HttpServletResponse res) {
        Admin a = admins.findByIdentifiant(r.identifiant().trim())
                .filter(x -> encoder.matches(r.motDePasse(), x.getMotDePasse()))
                .orElseThrow(AuthController::invalide);
        return connecter(res, a.getId(), CustomUserDetails.ADMIN, a.getIdentifiant());
    }

    @PostMapping("/auth/gestionnaire/login")
    public AuthUserDto loginGestionnaire(@Valid @RequestBody LoginRequest r, HttpServletResponse res) {
        Gestionnaire g = gestionnaires.findByEmailIgnoreCase(r.identifiant().trim())
                .filter(x -> x.isActif() && encoder.matches(r.motDePasse(), x.getMotDePasse()))
                .orElseThrow(AuthController::invalide);
        return connecter(res, g.getId(), CustomUserDetails.GESTIONNAIRE, g.getEntreprise());
    }

    @PostMapping("/auth/conducteur/login")
    public AuthUserDto loginConducteur(@Valid @RequestBody LoginRequest r, HttpServletResponse res) {
        String id = r.identifiant().trim();
        Conducteur c = conducteurs.findByEmailIgnoreCase(id)
                .or(() -> conducteurs.findByCodeConducteurIgnoreCase(id))
                .filter(x -> x.isActif() && encoder.matches(r.motDePasse(), x.getMotDePasse()))
                .orElseThrow(AuthController::invalide);
        return connecter(res, c.getId(), CustomUserDetails.CONDUCTEUR, c.getPrenom() + " " + c.getNom());
    }

    @PostMapping("/auth/logout")
    public Map<String, String> logout(HttpServletResponse res) {
        ResponseCookie vide = base("", Duration.ZERO);
        res.addHeader(HttpHeaders.SET_COOKIE, vide.toString());
        return Map.of("message", "Déconnecté");
    }

    @GetMapping("/auth/me")
    public AuthUserDto me() {
        CustomUserDetails u = CurrentUser.get();
        return new AuthUserDto(u.getId(), u.getRole(), u.getNom());
    }

    // ── Interne ───────────────────────────────────────────────────────────
    private AuthUserDto connecter(HttpServletResponse res, UUID id, String role, String nom) {
        String token = jwt.generate(id, role, nom);
        res.addHeader(HttpHeaders.SET_COOKIE, base(token, Duration.ofSeconds(jwt.getExpirationSeconds())).toString());
        return new AuthUserDto(id, role, nom);
    }

    private ResponseCookie base(String valeur, Duration duree) {
        return ResponseCookie.from(cookieName, valeur)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(duree)
                .build();
    }

    private static ResponseStatusException invalide() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, MSG_INVALIDE);
    }
}
