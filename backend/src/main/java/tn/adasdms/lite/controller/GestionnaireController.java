package tn.adasdms.lite.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import tn.adasdms.lite.dto.ConducteurDto;
import tn.adasdms.lite.dto.ConducteurRequest;
import tn.adasdms.lite.dto.DriverDetailDto;
import tn.adasdms.lite.dto.GestionnaireDashboardDto;
import tn.adasdms.lite.dto.VehiculeDto;
import tn.adasdms.lite.dto.VehiculeRequest;
import tn.adasdms.lite.security.CurrentUser;
import tn.adasdms.lite.service.FleetService;

/** Le gestionnaire ne voit et ne modifie que ses propres conducteurs et véhicules. */
@RestController
@RequestMapping("/api/gestionnaire")
@RequiredArgsConstructor
public class GestionnaireController {

    private final FleetService fleet;

    private static UUID moi() {
        return CurrentUser.get().getId();
    }

    // ── Conducteurs ───────────────────────────────────────────────────────
    @GetMapping("/conducteurs")
    public List<ConducteurDto> conducteurs() {
        return fleet.listerConducteurs(moi());
    }

    @PostMapping("/conducteurs")
    @ResponseStatus(HttpStatus.CREATED)
    public ConducteurDto creerConducteur(@Valid @RequestBody ConducteurRequest r) {
        return fleet.creerConducteur(moi(), r);
    }

    @PutMapping("/conducteurs/{id}")
    public ConducteurDto modifierConducteur(@PathVariable UUID id, @Valid @RequestBody ConducteurRequest r) {
        return fleet.modifierConducteur(moi(), id, r);
    }

    @DeleteMapping("/conducteurs/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimerConducteur(@PathVariable UUID id) {
        fleet.supprimerConducteur(moi(), id);
    }

    @GetMapping("/conducteurs/{id}/detail")
    public DriverDetailDto detail(@PathVariable UUID id,
                                  @RequestParam(defaultValue = "24h") String plage,
                                  @RequestParam(defaultValue = "0") int page) {
        return fleet.detail(moi(), id, plage, page);
    }

    // ── Véhicules ─────────────────────────────────────────────────────────
    @GetMapping("/vehicules")
    public List<VehiculeDto> vehicules() {
        return fleet.listerVehicules(moi());
    }

    @PostMapping("/vehicules")
    @ResponseStatus(HttpStatus.CREATED)
    public VehiculeDto creerVehicule(@Valid @RequestBody VehiculeRequest r) {
        return fleet.creerVehicule(moi(), r);
    }

    @PutMapping("/vehicules/{id}")
    public VehiculeDto modifierVehicule(@PathVariable UUID id, @Valid @RequestBody VehiculeRequest r) {
        return fleet.modifierVehicule(moi(), id, r);
    }

    @DeleteMapping("/vehicules/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimerVehicule(@PathVariable UUID id) {
        fleet.supprimerVehicule(moi(), id);
    }

    // ── Tableau de bord ───────────────────────────────────────────────────
    @GetMapping("/dashboard")
    public GestionnaireDashboardDto dashboard() {
        return fleet.dashboard(moi());
    }
}
