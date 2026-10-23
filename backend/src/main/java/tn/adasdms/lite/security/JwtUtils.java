package tn.adasdms.lite.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/** Création et validation des JWT (HMAC-SHA256, expiration 24 h par défaut). */
@Component
public class JwtUtils {

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtils(@Value("${app.jwt.secret}") String secret,
                    @Value("${app.jwt.expiration-hours}") long expirationHours) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET doit contenir au moins 32 caractères");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.expirationMs = expirationHours * 3_600_000L;
    }

    public long getExpirationSeconds() {
        return expirationMs / 1000;
    }

    public String generate(UUID id, String role, String nom) {
        Date now = new Date();
        return Jwts.builder()
                .subject(id.toString())
                .claim("role", role)
                .claim("nom", nom)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    /** Retourne l'utilisateur si le token est valide et non expiré, sinon vide. */
    public Optional<CustomUserDetails> parse(String token) {
        try {
            Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            return Optional.of(new CustomUserDetails(
                    UUID.fromString(c.getSubject()),
                    c.get("role", String.class),
                    c.get("nom", String.class)));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
