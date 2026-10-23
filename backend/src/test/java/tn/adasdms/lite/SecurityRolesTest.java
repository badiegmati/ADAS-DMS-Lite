package tn.adasdms.lite;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import jakarta.servlet.http.Cookie;
import tn.adasdms.lite.dto.ScoreDto;
import tn.adasdms.lite.entity.Conducteur;
import tn.adasdms.lite.entity.Gestionnaire;
import tn.adasdms.lite.repository.ConducteurRepository;
import tn.adasdms.lite.repository.GestionnaireRepository;
import tn.adasdms.lite.repository.MessageRepository;
import tn.adasdms.lite.repository.VehiculeRepository;
import tn.adasdms.lite.service.ScoreService;

/** Isolation par rôle : 401 sans token, 403 sur les ressources d'un autre utilisateur. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityRolesTest {

    private static final String MDP = "Motdepasse1";

    @Autowired MockMvc mvc;
    @Autowired GestionnaireRepository gestionnaires;
    @Autowired ConducteurRepository conducteurs;
    @Autowired VehiculeRepository vehicules;
    @Autowired MessageRepository messages;
    @Autowired PasswordEncoder encoder;

    // La fonction SQL calculer_score() n'existe pas dans H2 : le score est simulé
    @MockBean ScoreService scoreService;

    Gestionnaire g1;
    Gestionnaire g2;
    Conducteur c1;
    Conducteur c2;

    @BeforeEach
    void seed() {
        messages.deleteAll();
        conducteurs.deleteAll();
        vehicules.deleteAll();
        gestionnaires.deleteAll();
        g1 = gestionnaire("Alpha", "g1@test.tn");
        g2 = gestionnaire("Beta", "g2@test.tn");
        c1 = conducteur("C1", "c1@test.tn", g1);
        c2 = conducteur("C2", "c2@test.tn", g2);
        when(scoreService.courant(any(UUID.class))).thenAnswer(inv ->
                new ScoreDto(inv.getArgument(0), 12.0, "FAIBLE", 0, Instant.now()));
    }

    private Gestionnaire gestionnaire(String entreprise, String email) {
        Gestionnaire g = new Gestionnaire();
        g.setEntreprise(entreprise);
        g.setEmail(email);
        g.setMotDePasse(encoder.encode(MDP));
        return gestionnaires.save(g);
    }

    private Conducteur conducteur(String code, String email, Gestionnaire g) {
        Conducteur c = new Conducteur();
        c.setCodeConducteur(code);
        c.setNom("Nom" + code);
        c.setPrenom("Prenom" + code);
        c.setEmail(email);
        c.setMotDePasse(encoder.encode(MDP));
        c.setGestionnaireId(g.getId());
        return conducteurs.save(c);
    }

    private Cookie login(String role, String identifiant, String mdp) throws Exception {
        String token = TestSupport.token(mvc.perform(post("/api/auth/" + role + "/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(TestSupport.json(identifiant, mdp))).andReturn());
        return new Cookie("token", token);
    }

    @Test
    void sansTokenDonne401() throws Exception {
        mvc.perform(get("/api/gestionnaire/conducteurs")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/conducteur/me/dashboard")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/stats")).andExpect(status().isUnauthorized());
    }

    @Test
    void tokenFalsifieDonne401() throws Exception {
        mvc.perform(get("/api/gestionnaire/conducteurs").cookie(new Cookie("token", "abc.def.ghi")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void conducteurNAccedePasAuxEndpointsAdminEtGestionnaire() throws Exception {
        Cookie c = login("conducteur", "c1@test.tn", MDP);
        mvc.perform(get("/api/admin/gestionnaires").cookie(c)).andExpect(status().isForbidden());
        mvc.perform(get("/api/gestionnaire/conducteurs").cookie(c)).andExpect(status().isForbidden());
    }

    @Test
    void adminNAccedePasAuxEndpointsGestionnaire() throws Exception {
        Cookie a = login("admin", "admin", "Admin@12345");
        mvc.perform(get("/api/gestionnaire/dashboard").cookie(a)).andExpect(status().isForbidden());
        mvc.perform(get("/api/conducteur/me/dashboard").cookie(a)).andExpect(status().isForbidden());
    }

    @Test
    void gestionnaireNeVoitQueSesConducteurs() throws Exception {
        Cookie g = login("gestionnaire", "g1@test.tn", MDP);
        mvc.perform(get("/api/gestionnaire/conducteurs").cookie(g))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].codeConducteur").value("C1"))
                .andExpect(jsonPath("$[0].motDePasse").doesNotExist());
    }

    @Test
    void gestionnaireNePeutPasLireNiSupprimerUnConducteurDUneAutreFlotte() throws Exception {
        Cookie autre = login("gestionnaire", "g2@test.tn", MDP);
        mvc.perform(get("/api/gestionnaire/conducteurs/" + c1.getId() + "/detail").cookie(autre))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/gestionnaire/conducteurs/" + c1.getId()).cookie(autre))
                .andExpect(status().isForbidden());

        Cookie proprietaire = login("gestionnaire", "g1@test.tn", MDP);
        mvc.perform(get("/api/gestionnaire/conducteurs/" + c1.getId() + "/detail").cookie(proprietaire))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conducteur.codeConducteur").value("C1"));
    }

    @Test
    void gestionnaireCreeUnConducteurPuisLeCodeDoitEtreUnique() throws Exception {
        Cookie g = login("gestionnaire", "g1@test.tn", MDP);
        String corps = "{\"codeConducteur\":\"C99\",\"nom\":\"Ben\",\"prenom\":\"Sami\","
                + "\"email\":\"sami@test.tn\",\"motDePasse\":\"Motdepasse1\"}";
        mvc.perform(post("/api/gestionnaire/conducteurs").cookie(g)
                        .contentType(MediaType.APPLICATION_JSON).content(corps))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codeConducteur").value("C99"));
        mvc.perform(post("/api/gestionnaire/conducteurs").cookie(g)
                        .contentType(MediaType.APPLICATION_JSON).content(corps))
                .andExpect(status().isConflict());
        // le nouveau conducteur peut se connecter avec son code
        login("conducteur", "C99", MDP);
    }

    @Test
    void conducteurNeLitQueSaPropreConversation() throws Exception {
        Cookie c = login("conducteur", "c1@test.tn", MDP);
        mvc.perform(get("/api/messages/" + c2.getId()).cookie(c)).andExpect(status().isForbidden());
        mvc.perform(get("/api/messages/" + c1.getId()).cookie(c))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void messagerieGestionnaireVersConducteur() throws Exception {
        Cookie g = login("gestionnaire", "g1@test.tn", MDP);
        String corps = "{\"conducteurId\":\"" + c1.getId() + "\",\"contenu\":\"Bonjour, pensez à faire une pause\"}";
        mvc.perform(post("/api/messages").cookie(g).contentType(MediaType.APPLICATION_JSON).content(corps))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.expediteurRole").value("GESTIONNAIRE"));

        // un gestionnaire d'une autre flotte ne peut pas écrire à ce conducteur
        Cookie autre = login("gestionnaire", "g2@test.tn", MDP);
        mvc.perform(post("/api/messages").cookie(autre).contentType(MediaType.APPLICATION_JSON).content(corps))
                .andExpect(status().isForbidden());

        Cookie c = login("conducteur", "c1@test.tn", MDP);
        mvc.perform(get("/api/messages/" + c1.getId()).cookie(c))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].contenu").value("Bonjour, pensez à faire une pause"));
    }

    @Test
    void adminCreeUnGestionnaireQuiPeutSeConnecter() throws Exception {
        Cookie a = login("admin", "admin", "Admin@12345");
        String corps = "{\"entreprise\":\"Gamma Logistique\",\"email\":\"gamma@test.tn\",\"motDePasse\":\"Motdepasse1\"}";
        mvc.perform(post("/api/admin/gestionnaires").cookie(a).contentType(MediaType.APPLICATION_JSON).content(corps))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.entreprise").value("Gamma Logistique"));
        login("gestionnaire", "gamma@test.tn", "Motdepasse1");
    }
}
