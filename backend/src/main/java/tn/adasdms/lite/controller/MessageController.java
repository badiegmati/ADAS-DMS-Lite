package tn.adasdms.lite.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import tn.adasdms.lite.dto.MessageDto;
import tn.adasdms.lite.dto.MessageRequest;
import tn.adasdms.lite.entity.Conducteur;
import tn.adasdms.lite.entity.Message;
import tn.adasdms.lite.exception.ForbiddenException;
import tn.adasdms.lite.exception.NotFoundException;
import tn.adasdms.lite.repository.ConducteurRepository;
import tn.adasdms.lite.repository.MessageRepository;
import tn.adasdms.lite.security.CurrentUser;
import tn.adasdms.lite.security.CustomUserDetails;

/**
 * Messagerie gestionnaire ↔ conducteur. Un conducteur ne lit que sa conversation,
 * un gestionnaire seulement celles de ses conducteurs (sinon 403).
 */
@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageRepository messages;
    private final ConducteurRepository conducteurs;

    @GetMapping("/{conducteurId}")
    public List<MessageDto> lister(@PathVariable UUID conducteurId) {
        Conducteur c = autoriser(conducteurId);
        return messages.findByConducteurIdAndGestionnaireIdOrderByCreatedAtAsc(c.getId(), c.getGestionnaireId())
                .stream().map(MessageDto::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MessageDto envoyer(@Valid @RequestBody MessageRequest r) {
        CustomUserDetails u = CurrentUser.get();
        UUID conducteurId = u.isConducteur() ? u.getId() : r.conducteurId();
        if (conducteurId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "conducteurId est obligatoire");
        }
        Conducteur c = autoriser(conducteurId);
        Message m = new Message();
        m.setConducteurId(c.getId());
        m.setGestionnaireId(c.getGestionnaireId());
        m.setExpediteurRole(u.getRole());
        m.setContenu(r.contenu().trim());
        return MessageDto.from(messages.save(m));
    }

    /** Marque comme lus les messages reçus de l'autre partie. */
    @PutMapping("/{conducteurId}/lus")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void marquerLus(@PathVariable UUID conducteurId) {
        Conducteur c = autoriser(conducteurId);
        String autre = CurrentUser.get().isConducteur() ? CustomUserDetails.GESTIONNAIRE : CustomUserDetails.CONDUCTEUR;
        messages.marquerLus(c.getId(), autre);
    }

    private Conducteur autoriser(UUID conducteurId) {
        CustomUserDetails u = CurrentUser.get();
        if (u.isConducteur() && !u.getId().equals(conducteurId)) {
            throw new ForbiddenException("Vous ne pouvez accéder qu'à votre propre conversation");
        }
        Conducteur c = conducteurs.findById(conducteurId)
                .orElseThrow(() -> new NotFoundException("Conducteur introuvable"));
        if (u.isGestionnaire() && !c.getGestionnaireId().equals(u.getId())) {
            throw new ForbiddenException("Ce conducteur n'appartient pas à votre flotte");
        }
        return c;
    }
}
