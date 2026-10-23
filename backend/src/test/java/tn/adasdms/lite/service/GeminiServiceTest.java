package tn.adasdms.lite.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpServer;

import tn.adasdms.lite.config.GeminiProperties;

/** Teste GeminiService contre un faux serveur HTTP local (aucun appel réel à Google). */
class GeminiServiceTest {

    private HttpServer serveur;
    private final AtomicReference<String> cleRecue = new AtomicReference<>();
    private volatile int codeReponse = 200;

    @BeforeEach
    void demarrer() throws IOException {
        serveur = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        serveur.createContext("/v1beta/models/test-model:generateContent", ex -> {
            cleRecue.set(ex.getRequestHeaders().getFirst("x-goog-api-key"));
            String corps = codeReponse == 200
                    ? "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"  Faites une pause.  \"}]}}]}"
                    : "{\"error\":{\"message\":\"quota\"}}";
            byte[] octets = corps.getBytes(StandardCharsets.UTF_8);
            ex.getResponseHeaders().add("Content-Type", "application/json");
            ex.sendResponseHeaders(codeReponse, octets.length);
            try (OutputStream os = ex.getResponseBody()) {
                os.write(octets);
            }
        });
        serveur.start();
    }

    @AfterEach
    void arreter() {
        serveur.stop(0);
    }

    private GeminiService service(String cle) {
        String base = "http://127.0.0.1:" + serveur.getAddress().getPort() + "/v1beta";
        return new GeminiService(new GeminiProperties(cle, "test-model", base, 2000));
    }

    @Test
    void retourneLeTexteDeGeminiSansEspacesEtEnvoieLaCle() {
        GeminiResult r = service("MA_CLE").generer("prompt", "repli");
        assertEquals("Faites une pause.", r.texte());
        assertFalse(r.repli());
        assertEquals("test-model", r.modele());
        assertEquals("MA_CLE", cleRecue.get());
    }

    @Test
    void utiliseLeRepliSiGeminiRepondEnErreur() {
        codeReponse = 429;
        GeminiResult r = service("MA_CLE").generer("prompt", "message de repli");
        assertTrue(r.repli());
        assertEquals("message de repli", r.texte());
    }

    @Test
    void utiliseLeRepliSansCleApi() {
        GeminiResult r = service("").generer("prompt", "message de repli");
        assertTrue(r.repli());
        assertEquals("message de repli", r.texte());
        assertEquals(null, cleRecue.get());
    }
}
