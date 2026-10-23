package tn.adasdms.lite.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** Paramètres de l'API Gemini (préfixe « gemini » dans application.yml). */
@ConfigurationProperties(prefix = "gemini")
public record GeminiProperties(
        String apiKey,
        @DefaultValue("gemini-2.5-flash") String model,
        @DefaultValue("https://generativelanguage.googleapis.com/v1beta") String baseUrl,
        @DefaultValue("10000") int timeoutMs) {
}
