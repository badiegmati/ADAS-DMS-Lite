package tn.adasdms.lite.dto;

import java.util.List;

import org.springframework.data.domain.Page;

/** Page de résultats sérialisable. */
public record PageDto<T>(List<T> contenu, int page, int taille, long total, int totalPages) {

    public static <T> PageDto<T> from(Page<T> p) {
        return new PageDto<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }
}
