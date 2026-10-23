package tn.adasdms.lite.controller;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import tn.adasdms.lite.dto.AdminStatsDto;
import tn.adasdms.lite.dto.GestionnaireDto;
import tn.adasdms.lite.dto.GestionnaireRequest;
import tn.adasdms.lite.entity.Gestionnaire;
import tn.adasdms.lite.exception.NotFoundException;
import tn.adasdms.lite.repository.AlerteRepository;
import tn.adasdms.lite.repository.ConducteurRepository;
import tn.adasdms.lite.repository.GestionnaireRepository;
import tn.adasdms.lite.repository.VehiculeRepository;
import tn.adasdms.lite.security.CurrentUser;

/** L'administrateur gère uniquement les gestionnaires (comptes entreprise). */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final GestionnaireRepository gestionnaires;
    private final ConducteurRepository conducteurs;
    private final VehiculeRepository vehicules;
    private final AlerteRepository alertes;
    private final PasswordEncoder encoder;

    @GetMapping("/gestionnaires")
    public List<GestionnaireDto> lister() {
        return gestionnaires.findAllByOrderByEntrepriseAsc().stream().map(this::toDto).toList();
    }

    @PostMapping("/gestionnaires")
    @ResponseStatus(HttpStatus.CREATED)
    public GestionnaireDto creer(@Valid @RequestBody GestionnaireRequest r) {
        if (r.motDePasse() == null || r.motDePasse().length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le mot de passe doit contenir au moins 8 caractères");
        }
        String email = r.email().trim().toLowerCase();
        if (gestionnaires.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet e-mail est déjà utilisé");
        }
        if (gestionnaires.existsByEntrepriseIgnoreCase(r.entreprise().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cette entreprise existe déjà");
        }
        Gestionnaire g = new Gestionnaire();
        g.setEntreprise(r.entreprise().trim());
        g.setEmail(email);
        g.setMotDePasse(encoder.encode(r.motDePasse()));
        g.setActif(r.actif() == null || r.actif());
        g.setAdminId(CurrentUser.get().getId());
        return toDto(gestionnaires.save(g));
    }

    @PutMapping("/gestionnaires/{id}")
    public GestionnaireDto modifier(@PathVariable UUID id, @Valid @RequestBody GestionnaireRequest r) {
        Gestionnaire g = gestionnaires.findById(id).orElseThrow(() -> new NotFoundException("Gestionnaire introuvable"));
        String email = r.email().trim().toLowerCase();
        if (!email.equalsIgnoreCase(g.getEmail()) && gestionnaires.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet e-mail est déjà utilisé");
        }
        String entreprise = r.entreprise().trim();
        if (!entreprise.equalsIgnoreCase(g.getEntreprise()) && gestionnaires.existsByEntrepriseIgnoreCase(entreprise)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cette entreprise existe déjà");
        }
        g.setEntreprise(entreprise);
        g.setEmail(email);
        if (r.actif() != null) {
            g.setActif(r.actif());
        }
        if (r.motDePasse() != null && !r.motDePasse().isBlank()) {
            if (r.motDePasse().length() < 8) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le mot de passe doit contenir au moins 8 caractères");
            }
            g.setMotDePasse(encoder.encode(r.motDePasse()));
        }
        return toDto(gestionnaires.save(g));
    }

    @DeleteMapping("/gestionnaires/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable UUID id) {
        Gestionnaire g = gestionnaires.findById(id).orElseThrow(() -> new NotFoundException("Gestionnaire introuvable"));
        gestionnaires.delete(g);   // supprime en cascade conducteurs, véhicules, alertes, messages (FK SQL)
    }

    @GetMapping("/stats")
    public AdminStatsDto stats() {
        return new AdminStatsDto(
                gestionnaires.count(),
                conducteurs.count(),
                vehicules.count(),
                alertes.countByHorodatageAfter(Instant.now().minus(Duration.ofHours(24))));
    }

    private GestionnaireDto toDto(Gestionnaire g) {
        return GestionnaireDto.of(g, conducteurs.countByGestionnaireId(g.getId()),
                vehicules.countByGestionnaireId(g.getId()));
    }
}
