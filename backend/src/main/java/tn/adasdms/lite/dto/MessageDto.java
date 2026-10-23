package tn.adasdms.lite.dto;

import java.time.Instant;
import java.util.UUID;

import tn.adasdms.lite.entity.Message;

public record MessageDto(Long id, UUID conducteurId, String expediteurRole, String contenu,
                         boolean lu, Instant createdAt) {

    public static MessageDto from(Message m) {
        return new MessageDto(m.getId(), m.getConducteurId(), m.getExpediteurRole(), m.getContenu(),
                m.isLu(), m.getCreatedAt());
    }
}
