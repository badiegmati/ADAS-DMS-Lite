package tn.adasdms.lite.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import tn.adasdms.lite.entity.Admin;
import tn.adasdms.lite.repository.AdminRepository;

/** Crée le compte administrateur au premier démarrage s'il n'existe pas. */
@Component
public class AdminSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final AdminRepository admins;
    private final PasswordEncoder encoder;
    private final String identifiant;
    private final String motDePasse;

    public AdminSeeder(AdminRepository admins, PasswordEncoder encoder,
                       @Value("${app.admin.identifiant}") String identifiant,
                       @Value("${app.admin.default-password}") String motDePasse) {
        this.admins = admins;
        this.encoder = encoder;
        this.identifiant = identifiant;
        this.motDePasse = motDePasse;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (admins.existsByIdentifiant(identifiant)) {
            return;
        }
        Admin a = new Admin();
        a.setIdentifiant(identifiant);
        a.setMotDePasse(encoder.encode(motDePasse));
        admins.save(a);
        log.info("Compte administrateur '{}' créé", identifiant);
    }
}
