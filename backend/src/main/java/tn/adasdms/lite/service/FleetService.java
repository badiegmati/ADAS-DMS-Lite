package tn.adasdms.lite.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;
import tn.adasdms.lite.dto.AlerteDto;
import tn.adasdms.lite.dto.ConducteurDto;
import tn.adasdms.lite.dto.ConducteurRequest;
import tn.adasdms.lite.dto.DriverDetailDto;
import tn.adasdms.lite.dto.GestionnaireDashboardDto;
import tn.adasdms.lite.dto.PageDto;
import tn.adasdms.lite.dto.ScoreDto;
import tn.adasdms.lite.dto.VehiculeDto;
import tn.adasdms.lite.dto.VehiculeRequest;
import tn.adasdms.lite.entity.Conducteur;
import tn.adasdms.lite.entity.Vehicule;
import tn.adasdms.lite.exception.ForbiddenException;
import tn.adasdms.lite.exception.NotFoundException;
import tn.adasdms.lite.repository.AlerteRepository;
import tn.adasdms.lite.repository.ConducteurRepository;
import tn.adasdms.lite.repository.VehiculeRepository;

/** Logique du gestionnaire de flotte : conducteurs, véhicules, tableau de bord, détail conducteur. */
@Service
@RequiredArgsConstructor
public class FleetService {

    private static final int TAILLE_PAGE = 20;

    private final ConducteurRepository conducteurs;
    private final VehiculeRepository vehicules;
    private final AlerteRepository alertes;
    private final ScoreService scores;
    private final ConseilService conseilService;
    private final PasswordEncoder encoder;

    // ══════════════════════════ Conducteurs ══════════════════════════
    public List<ConducteurDto> listerConducteurs(UUID gid) {
        Map<UUID, String> matricules = matricules(gid);
        return conducteurs.findByGestionnaireIdOrderByNomAsc(gid).stream()
                .map(c -> toDto(c, matricules))
                .toList();
    }

    public ConducteurDto creerConducteur(UUID gid, ConducteurRequest r) {
        if (r.codeConducteur() == null || r.codeConducteur().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le code conducteur est obligatoire");
        }
        String code = r.codeConducteur().trim().toUpperCase();
        String email = normaliser(r.email());
        if (conducteurs.existsByCodeConducteurIgnoreCase(code)) {
            throw conflit("Ce code conducteur existe déjà");
        }
        if (conducteurs.existsByEmailIgnoreCase(email)) {
            throw conflit("Cet e-mail est déjà utilisé");
        }
        Conducteur c = new Conducteur();
        c.setCodeConducteur(code);
        c.setNom(r.nom().trim());
        c.setPrenom(r.prenom().trim());
        c.setEmail(email);
        c.setTelephone(r.telephone() == null ? null : r.telephone().trim());
        c.setMotDePasse(encoder.encode(motDePasseValide(r.motDePasse())));
        c.setActif(r.actif() == null || r.actif());
        c.setGestionnaireId(gid);
        c.setVehiculeId(verifierVehicule(gid, r.vehiculeId(), null));
        return toDto(conducteurs.save(c), matricules(gid));
    }

    public ConducteurDto modifierConducteur(UUID gid, UUID id, ConducteurRequest r) {
        Conducteur c = conducteurDe(gid, id);
        String email = normaliser(r.email());
        if (!email.equalsIgnoreCase(c.getEmail()) && conducteurs.existsByEmailIgnoreCase(email)) {
            throw conflit("Cet e-mail est déjà utilisé");
        }
        c.setNom(r.nom().trim());
        c.setPrenom(r.prenom().trim());
        c.setEmail(email);
        c.setTelephone(r.telephone() == null ? null : r.telephone().trim());
        if (r.actif() != null) {
            c.setActif(r.actif());
        }
        c.setVehiculeId(verifierVehicule(gid, r.vehiculeId(), c.getId()));
        if (r.motDePasse() != null && !r.motDePasse().isBlank()) {
            c.setMotDePasse(encoder.encode(motDePasseValide(r.motDePasse())));
        }
        return toDto(conducteurs.save(c), matricules(gid));
    }

    public void supprimerConducteur(UUID gid, UUID id) {
        conducteurs.delete(conducteurDe(gid, id));
    }

    // ══════════════════════════ Véhicules ══════════════════════════
    public List<VehiculeDto> listerVehicules(UUID gid) {
        Map<UUID, String> conducteurParVehicule = conducteurs.findByGestionnaireIdOrderByNomAsc(gid).stream()
                .filter(c -> c.getVehiculeId() != null)
                .collect(Collectors.toMap(Conducteur::getVehiculeId, c -> c.getPrenom() + " " + c.getNom(),
                        (a, b) -> a));
        return vehicules.findByGestionnaireIdOrderByMatriculeAsc(gid).stream()
                .map(v -> VehiculeDto.of(v, conducteurParVehicule.get(v.getId())))
                .toList();
    }

    public VehiculeDto creerVehicule(UUID gid, VehiculeRequest r) {
        String matricule = r.matricule().trim();
        if (vehicules.existsByMatriculeIgnoreCase(matricule)) {
            throw conflit("Ce matricule existe déjà");
        }
        Vehicule v = new Vehicule();
        v.setMatricule(matricule);
        v.setMarque(r.marque());
        v.setModele(r.modele());
        v.setStatut(r.statut() == null ? "ACTIF" : r.statut());
        v.setGestionnaireId(gid);
        return VehiculeDto.of(vehicules.save(v), null);
    }

    public VehiculeDto modifierVehicule(UUID gid, UUID id, VehiculeRequest r) {
        Vehicule v = vehiculeDe(gid, id);
        String matricule = r.matricule().trim();
        if (!matricule.equalsIgnoreCase(v.getMatricule()) && vehicules.existsByMatriculeIgnoreCase(matricule)) {
            throw conflit("Ce matricule existe déjà");
        }
        v.setMatricule(matricule);
        v.setMarque(r.marque());
        v.setModele(r.modele());
        if (r.statut() != null) {
            v.setStatut(r.statut());
        }
        String nom = conducteurs.findByVehiculeId(v.getId()).map(c -> c.getPrenom() + " " + c.getNom()).orElse(null);
        return VehiculeDto.of(vehicules.save(v), nom);
    }

    public void supprimerVehicule(UUID gid, UUID id) {
        vehicules.delete(vehiculeDe(gid, id));
    }

    // ══════════════════════════ Tableau de bord ══════════════════════════
    public GestionnaireDashboardDto dashboard(UUID gid) {
        Map<UUID, String> matricules = matricules(gid);
        List<ConducteurDto> tous = conducteurs.findByGestionnaireIdOrderByNomAsc(gid).stream()
                .map(c -> toDto(c, matricules))
                .toList();
        List<ConducteurDto> actifs = tous.stream().filter(ConducteurDto::actif).toList();

        Map<String, Long> repartition = new LinkedHashMap<>();
        for (String n : List.of(Niveau.FAIBLE, Niveau.MODERE, Niveau.ELEVE, Niveau.CRITIQUE)) {
            repartition.put(n, 0L);
        }
        for (ConducteurDto c : actifs) {
            repartition.merge(c.score().niveau(), 1L, Long::sum);
        }
        double moyenne = actifs.stream().mapToDouble(c -> c.score().valeur()).average().orElse(0.0);
        List<ConducteurDto> top = new ArrayList<>(actifs);
        top.sort(Comparator.comparingDouble((ConducteurDto c) -> c.score().valeur()).reversed());

        GestionnaireDashboardDto.Kpi kpi = new GestionnaireDashboardDto.Kpi(
                actifs.size(), matricules.size(), Math.round(moyenne * 10.0) / 10.0,
                repartition.get(Niveau.CRITIQUE));
        return new GestionnaireDashboardDto(kpi, repartition, top.stream().limit(5).toList(), tous);
    }

    public DriverDetailDto detail(UUID gid, UUID conducteurId, String plage, int page) {
        Conducteur c = conducteurDe(gid, conducteurId);
        ConducteurDto dto = toDto(c, matricules(gid));
        PageDto<AlerteDto> pageAlertes = PageDto.from(
                alertes.findByConducteurIdOrderByHorodatageDesc(c.getId(), PageRequest.of(Math.max(page, 0), TAILLE_PAGE))
                        .map(AlerteDto::from));
        return new DriverDetailDto(
                dto,
                pageAlertes,
                scores.historique(c.getId(), plage),
                alertes.findTop100ByConducteurIdOrderByHorodatageDesc(c.getId()).stream().map(AlerteDto::from).toList(),
                conseilService.lister(c.getId()));
    }

    // ══════════════════════════ Interne ══════════════════════════
    private ConducteurDto toDto(Conducteur c, Map<UUID, String> matricules) {
        ScoreDto score = scores.courant(c.getId());
        String matricule = c.getVehiculeId() == null ? null : matricules.get(c.getVehiculeId());
        return ConducteurDto.of(c, matricule, score);
    }

    private Map<UUID, String> matricules(UUID gid) {
        return vehicules.findByGestionnaireIdOrderByMatriculeAsc(gid).stream()
                .collect(Collectors.toMap(Vehicule::getId, Vehicule::getMatricule, (a, b) -> a));
    }

    /** Charge un conducteur et vérifie qu'il appartient bien à la flotte du gestionnaire (sinon 403). */
    private Conducteur conducteurDe(UUID gid, UUID id) {
        Conducteur c = conducteurs.findById(id).orElseThrow(() -> new NotFoundException("Conducteur introuvable"));
        if (!c.getGestionnaireId().equals(gid)) {
            throw new ForbiddenException("Ce conducteur n'appartient pas à votre flotte");
        }
        return c;
    }

    private Vehicule vehiculeDe(UUID gid, UUID id) {
        Vehicule v = vehicules.findById(id).orElseThrow(() -> new NotFoundException("Véhicule introuvable"));
        if (!v.getGestionnaireId().equals(gid)) {
            throw new ForbiddenException("Ce véhicule n'appartient pas à votre flotte");
        }
        return v;
    }

    /** Vérifie que le véhicule est à ce gestionnaire et libre (ou déjà affecté à ce conducteur). */
    private UUID verifierVehicule(UUID gid, UUID vehiculeId, UUID conducteurCourant) {
        if (vehiculeId == null) {
            return null;
        }
        vehiculeDe(gid, vehiculeId);
        conducteurs.findByVehiculeId(vehiculeId).ifPresent(autre -> {
            if (!autre.getId().equals(conducteurCourant)) {
                throw conflit("Ce véhicule est déjà affecté à un autre conducteur");
            }
        });
        return vehiculeId;
    }

    private static String motDePasseValide(String mdp) {
        if (mdp == null || mdp.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le mot de passe doit contenir au moins 8 caractères");
        }
        return mdp;
    }

    private static String normaliser(String email) {
        return email.trim().toLowerCase();
    }

    private static ResponseStatusException conflit(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}
