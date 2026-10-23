package tn.adasdms.lite.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import tn.adasdms.lite.dto.ConseilDto;
import tn.adasdms.lite.security.CurrentUser;
import tn.adasdms.lite.service.ConseilService;
import tn.adasdms.lite.service.DriverService;

/** Messages d'alerte et conseils générés par Gemini pour le conducteur connecté. */
@RestController
@RequestMapping("/api/conducteur/me/conseils")
@RequiredArgsConstructor
public class ConseilController {

    private final ConseilService conseils;
    private final DriverService driver;

    @GetMapping
    public List<ConseilDto> lister() {
        return conseils.lister(CurrentUser.get().getId());
    }

    /** « Obtenir des conseils » : limité à une génération toutes les 6 heures (HTTP 429 sinon). */
    @PostMapping("/generer")
    public ConseilDto generer() {
        return conseils.genererManuel(driver.conducteur(CurrentUser.get().getId()));
    }

    @PutMapping("/lus")
    public Map<String, String> marquerLus() {
        conseils.marquerLus(CurrentUser.get().getId());
        return Map.of("message", "Conseils marqués comme lus");
    }
}
