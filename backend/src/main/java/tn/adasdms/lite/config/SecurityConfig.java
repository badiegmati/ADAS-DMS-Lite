package tn.adasdms.lite.config;

import java.io.IOException;
import java.time.Instant;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletResponse;
import tn.adasdms.lite.dto.ErrorDto;
import tn.adasdms.lite.security.JwtAuthFilter;

/**
 * Sécurité : API stateless, JWT dans un cookie httpOnly.
 * ADMIN -> /api/admin, GESTIONNAIRE -> /api/gestionnaire, CONDUCTEUR -> /api/conducteur.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** Le filtre JWT ne doit tourner que dans la chaîne Spring Security (pas une 2e fois côté servlet). */
    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtFilterRegistration(JwtAuthFilter filter) {
        FilterRegistrationBean<JwtAuthFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthFilter jwtFilter,
                                                   CorsConfigurationSource cors,
                                                   ObjectMapper mapper) throws Exception {
        http
            .csrf(csrf -> csrf.disable())   // API JSON + cookie SameSite=Lax + CORS restreint
            .cors(c -> c.configurationSource(cors))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/health", "/api/auth/*/login", "/api/auth/logout").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/gestionnaire/**").hasRole("GESTIONNAIRE")
                .requestMatchers("/api/conducteur/**").hasRole("CONDUCTEUR")
                .requestMatchers("/api/messages/**").hasAnyRole("GESTIONNAIRE", "CONDUCTEUR")
                .anyRequest().authenticated())
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req, res, ex) ->
                        writeError(mapper, res, HttpStatus.UNAUTHORIZED, "Authentification requise"))
                .accessDeniedHandler((req, res, ex) ->
                        writeError(mapper, res, HttpStatus.FORBIDDEN, "Accès refusé")))
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private static void writeError(ObjectMapper mapper, HttpServletResponse res,
                                   HttpStatus status, String message) throws IOException {
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        mapper.writeValue(res.getWriter(), new ErrorDto(message, status.value(), Instant.now()));
    }
}
