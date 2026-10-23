package tn.adasdms.lite.service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;
import tn.adasdms.lite.dto.AlerteDto;
import tn.adasdms.lite.dto.ConducteurDto;
import tn.adasdms.lite.dto.ConseilDto;
import tn.adasdms.lite.dto.DriverDashboardDto;
import tn.adasdms.lite.dto.PageDto;
import tn.adasdms.lite.dto.ProfilRequest;
import tn.adasdms.lite.dto.ScoreDto;
import tn.adasdms.lite.entity.Alerte;
import tn.adasdms.lite.entity.Conducteur;
import tn.adasdms.lite.exception.NotFoundException;
import tn.adasdms.lite.repository.AlerteRepository;
import tn.adasdms.lite.repository.ConducteurRepository;
import tn.adasdms.lite.repository.ConseilIaRepository;
import tn.adasdms.lite.repository.MessageRepository;
import tn.adasdms.lite.repository.VehiculeRepository;

/** Logique côté conducteur : tableau de bord, alertes, carte, profil. */
@Service
@RequiredArgsConstructor
public class DriverService {

    private static final int TAILLE_PAGE = 20;

    private final ConducteurRepository conducteurs;
    private final VehiculeRepository vehicules;
    private final AlerteRepository alertes;
    private final ConseilIaRepository conseils;
    private final MessageRepository messages;
    private final ScoreService scores;
    private final PasswordEncoder encoder;

    public Conducteur conducteur(UUID id) {
        return conducteurs.findById(id).orElseThrow(() -> new NotFoundException("Conducteur introuvable"));
    }

    public ConducteurDto profil(UUID id) {
        Conducteur c = conducteur(id);
        return toDto(c, scores.courant(id));
    }

    public DriverDashboardDto dashboard(UUID id) {
        Conducteur c = conducteur(id);
        ScoreDto score = scores.courant(id);
        Instant depuis = Instant.now().minus(Duration.ofHours(24));
        ConseilDto enAvant = conseils.findFirstByConducteurIdAndLuFalseOrderByCreatedAtDesc(id)
                .or(() -> conseils.findFirstByConducteurIdOrderByCreatedAtDesc(id))
                .map(ConseilDto::from)
                .orElse(null);
        return new DriverDashboardDto(
                toDto(c, score),
                score,
                alertes.countByConducteurIdAndHorodatageAfter(id, depuis),
                alertes.countByConducteurIdAndCritiqueTrueAndHorodatageAfter(id, depuis),
                conseils.countByConducteurIdAndLuFalse(id),
                messages.countByConducteurIdAndExpediteurRoleAndLuFalse(id, "GESTIONNAIRE"),
                alertes.findTop10ByConducteurIdOrderByHorodatageDesc(id).stream().map(AlerteDto::from).toList(),
                enAvant);
    }

    /** categorie : FATIGUE, DISTRACTION, PHONE ou vide (toutes). */
    public PageDto<AlerteDto> alertes(UUID id, String categorie, int page) {
        Pageable p = PageRequest.of(Math.max(page, 0), TAILLE_PAGE);
        List<String> types = typesDeCategorie(categorie);
        Page<Alerte> res = types.isEmpty()
                ? alertes.findByConducteurIdOrderByHorodatageDesc(id, p)
                : alertes.findByConducteurIdAndTypeAlerteInOrderByHorodatageDesc(id, types, p);
        return PageDto.from(res.map(AlerteDto::from));
    }

    public List<AlerteDto> carte(UUID id) {
        return alertes.findTop100ByConducteurIdOrderByHorodatageDesc(id).stream().map(AlerteDto::from).toList();
    }

    /** Seuls l'e-mail, le téléphone et le mot de passe sont modifiables (code, nom, prénom, véhicule verrouillés). */
    public ConducteurDto majProfil(UUID id, ProfilRequest r) {
        Conducteur c = conducteur(id);
        if (r.email() != null && !r.email().isBlank()) {
            String email = r.email().trim().toLowerCase();
            if (!email.equalsIgnoreCase(c.getEmail()) && conducteurs.existsByEmailIgnoreCase(email)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet e-mail est déjà utilisé");
            }
            c.setEmail(email);
        }
        if (r.telephone() != null) {
            c.setTelephone(r.telephone().trim());
        }
        if (r.motDePasse() != null && !r.motDePasse().isBlank()) {
            if (r.motDePasse().length() < 8) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Le mot de passe doit contenir au moins 8 caractères");
            }
            c.setMotDePasse(encoder.encode(r.motDePasse()));
        }
        conducteurs.save(c);
        return toDto(c, scores.courant(id));
    }

    private ConducteurDto toDto(Conducteur c, ScoreDto score) {
        String matricule = c.getVehiculeId() == null ? null
                : vehicules.findById(c.getVehiculeId()).map(v -> v.getMatricule()).orElse(null);
        return ConducteurDto.of(c, matricule, score);
    }

    private static List<String> typesDeCategorie(String categorie) {
        if (categorie == null) {
            return List.of();
        }
        return switch (categorie.toUpperCase()) {
            case "FATIGUE" -> List.of("FATIGUE_YAWN", "FATIGUE_DROP", "FATIGUE_EYES_DROWSY", "FATIGUE_EYES_CLOSED");
            case "DISTRACTION" -> List.of("DISTRACTION");
            case "PHONE" -> List.of("PHONE");
            default -> List.of();
        };
    }
}
