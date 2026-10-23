package tn.adasdms.lite.service;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.JsonNode;

import tn.adasdms.lite.config.GeminiProperties;

/**
 * Appel de l'API REST Gemini (offre gratuite). Appelée uniquement depuis le backend :
 * la clé n'est jamais envoyée au navigateur. Timeout 10 s, une seule tentative,
 * message de repli en français si l'API échoue ou si le quota est dépassé.
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    private final GeminiProperties props;
    private final RestClient client;

    public GeminiService(GeminiProperties props) {
        this.props = props;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(props.timeoutMs());
        factory.setReadTimeout(props.timeoutMs());
        this.client = RestClient.builder()
                .requestFactory(factory)
                .baseUrl(props.baseUrl())
                .build();
    }

    public GeminiResult generer(String prompt, String repli) {
        if (props.apiKey() == null || props.apiKey().isBlank()) {
            log.warn("GEMINI_API_KEY absente : message de repli utilisé");
            return new GeminiResult(repli, true, "repli");
        }
        try {
            Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                    "generationConfig", Map.of("temperature", 0.7));
            JsonNode reponse = client.post()
                    .uri("/models/{modele}:generateContent", props.model())
                    .header("x-goog-api-key", props.apiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            String texte = reponse == null ? "" : reponse.path("candidates").path(0).path("content")
                    .path("parts").path(0).path("text").asText("").trim();
            if (texte.isEmpty()) {
                log.warn("Réponse Gemini vide : message de repli utilisé");
                return new GeminiResult(repli, true, "repli");
            }
            return new GeminiResult(texte, false, props.model());
        } catch (Exception e) {
            log.warn("Appel Gemini impossible ({}) : message de repli utilisé", e.getMessage());
            return new GeminiResult(repli, true, "repli");
        }
    }
}
