package tn.adasdms.lite.dto;

import java.math.BigDecimal;
import java.time.Instant;

import tn.adasdms.lite.entity.ConseilIa;

public record ConseilDto(Long id, String type, String contenu, Double scoreMoment, String modele,
                         boolean lu, Instant createdAt) {

    public static ConseilDto from(ConseilIa c) {
        BigDecimal s = c.getScoreMoment();
        return new ConseilDto(c.getId(), c.getType(), c.getContenu(), s == null ? null : s.doubleValue(),
                c.getModele(), c.isLu(), c.getCreatedAt());
    }
}
