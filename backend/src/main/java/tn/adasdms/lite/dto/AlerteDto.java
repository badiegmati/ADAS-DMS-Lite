package tn.adasdms.lite.dto;

import java.time.Instant;

import tn.adasdms.lite.entity.Alerte;

public record AlerteDto(Long id, String type, int severite, boolean critique, String description,
                        Double latitude, Double longitude, Instant horodatage) {

    public static AlerteDto from(Alerte a) {
        return new AlerteDto(a.getId(), a.getTypeAlerte(), a.getSeverite(), a.isCritique(),
                a.getDescription(), a.getLatitude(), a.getLongitude(), a.getHorodatage());
    }
}
