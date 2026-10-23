package tn.adasdms.lite.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import tn.adasdms.lite.dto.AlerteDto;
import tn.adasdms.lite.dto.ConducteurDto;
import tn.adasdms.lite.dto.DriverDashboardDto;
import tn.adasdms.lite.dto.PageDto;
import tn.adasdms.lite.dto.ProfilRequest;
import tn.adasdms.lite.dto.ScorePointDto;
import tn.adasdms.lite.security.CurrentUser;
import tn.adasdms.lite.service.DriverService;
import tn.adasdms.lite.service.ScoreService;

/** Espace du conducteur : il n'accède qu'à ses propres données (l'id vient du JWT). */
@RestController
@RequestMapping("/api/conducteur/me")
@RequiredArgsConstructor
public class ConducteurController {

    private final DriverService driver;
    private final ScoreService scores;

    @GetMapping("/dashboard")
    public DriverDashboardDto dashboard() {
        return driver.dashboard(CurrentUser.get().getId());
    }

    @GetMapping("/alertes")
    public PageDto<AlerteDto> alertes(@RequestParam(required = false) String categorie,
                                      @RequestParam(defaultValue = "0") int page) {
        return driver.alertes(CurrentUser.get().getId(), categorie, page);
    }

    @GetMapping("/carte")
    public List<AlerteDto> carte() {
        return driver.carte(CurrentUser.get().getId());
    }

    @GetMapping("/score/historique")
    public List<ScorePointDto> historique(@RequestParam(defaultValue = "24h") String plage) {
        return scores.historique(CurrentUser.get().getId(), plage);
    }

    @GetMapping("/profil")
    public ConducteurDto profil() {
        return driver.profil(CurrentUser.get().getId());
    }

    @PutMapping("/profil")
    public ConducteurDto majProfil(@Valid @RequestBody ProfilRequest r) {
        return driver.majProfil(CurrentUser.get().getId(), r);
    }
}
