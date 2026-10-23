package tn.adasdms.lite.service;

/** Réponse de Gemini, ou message de repli si l'API est indisponible (repli = true). */
public record GeminiResult(String texte, boolean repli, String modele) {
}
