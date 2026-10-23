package tn.adasdms.lite;

import org.springframework.test.web.servlet.MvcResult;

/** Utilitaires communs aux tests d'API. */
public final class TestSupport {

    private TestSupport() {
    }

    /** Extrait la valeur du cookie « token » depuis les en-têtes Set-Cookie de la réponse. */
    public static String token(MvcResult result) {
        for (String h : result.getResponse().getHeaders("Set-Cookie")) {
            if (h.startsWith("token=")) {
                int fin = h.indexOf(';');
                return h.substring("token=".length(), fin < 0 ? h.length() : fin);
            }
        }
        throw new AssertionError("Aucun cookie token dans la réponse");
    }

    public static String json(String identifiant, String motDePasse) {
        return "{\"identifiant\":\"" + identifiant + "\",\"motDePasse\":\"" + motDePasse + "\"}";
    }
}
