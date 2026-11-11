package com.smartguard.services;

import com.smartguard.dto.alert.AlertEvidenceResponse;
import com.smartguard.dto.alert.AlertResponse;
import com.smartguard.dto.alert.OccurrenceHistoryResponse;
import com.smartguard.dto.alert.UpdateAlertStatusRequest;
import com.smartguard.entities.Alert;
import com.smartguard.entities.AlertEvidence;
import com.smartguard.entities.OccurrenceHistory;
import com.smartguard.entities.enums.AlertPriority;
import com.smartguard.entities.enums.AlertStatus;
import com.smartguard.entities.enums.AlertType;
import com.smartguard.exceptions.ResourceNotFoundException;
import com.smartguard.repositories.AlertEvidenceRepository;
import com.smartguard.repositories.AlertRepository;
import com.smartguard.repositories.AlertSpecifications;
import com.smartguard.repositories.OccurrenceHistoryRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final AlertEvidenceRepository alertEvidenceRepository;
    private final OccurrenceHistoryRepository occurrenceHistoryRepository;
    private final AlertLabelMapper alertLabelMapper;

    @Transactional(readOnly = true)
    public List<AlertResponse> search(
            AlertType type,
            AlertPriority priority,
            AlertStatus status,
            Long cameraId,
            Instant from,
            Instant to,
            String search
    ) {
        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();
        return alertRepository.findAll(
                        AlertSpecifications.withFilters(type, priority, status, cameraId, from, to, normalizedSearch),
                        Sort.by(Sort.Direction.DESC, "occurredAt")
                ).stream()
                .map(alert -> toResponse(alert, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public AlertResponse getById(Long id) {
        Alert alert = alertRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alerta não encontrado: " + id));
        return toResponse(alert, true);
    }

    @Transactional
    public AlertResponse updateStatus(Long id, UpdateAlertStatusRequest request) {
        Alert alert = alertRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alerta não encontrado: " + id));

        AlertStatus previous = alert.getStatus();
        if (previous == request.status()) {
            return toResponse(alert, true);
        }

        alert.setStatus(request.status());

        OccurrenceHistory history = OccurrenceHistory.builder()
                .alert(alert)
                .previousStatus(previous)
                .newStatus(request.status())
                .notes(request.notes() == null || request.notes().isBlank()
                        ? "Status atualizado pela central de alertas."
                        : request.notes().trim())
                .build();
        occurrenceHistoryRepository.save(history);

        return toResponse(alert, true);
    }

    private AlertResponse toResponse(Alert alert, boolean includeDetails) {
        List<AlertEvidenceResponse> evidences = List.of();
        List<OccurrenceHistoryResponse> history = List.of();
        String evidenceUrl = null;

        if (includeDetails) {
            List<AlertEvidence> evidenceEntities = alertEvidenceRepository.findByAlertId(alert.getId());
            evidences = evidenceEntities.stream().map(this::toEvidence).toList();
            evidenceUrl = evidences.isEmpty() ? alert.getCamera().getDemoMediaUrl() : evidences.getFirst().mediaUrl();
            history = occurrenceHistoryRepository.findByAlertIdOrderByChangedAtDesc(alert.getId()).stream()
                    .map(this::toHistory)
                    .toList();
        } else {
            evidenceUrl = alert.getCamera().getDemoMediaUrl();
        }

        return new AlertResponse(
                alert.getId(),
                alert.getPublicId(),
                alert.getType().name(),
                alertLabelMapper.toLabel(alert.getType()),
                alert.getPriority().name(),
                alert.getStatus().name(),
                alert.getDescription(),
                alert.isSimulated(),
                alert.getOccurredAt(),
                alert.getUpdatedAt(),
                alert.getCamera().getId(),
                alert.getCamera().getName(),
                alert.getCamera().getLocation(),
                alert.getCamera().getIdentifier(),
                evidenceUrl,
                evidences,
                history
        );
    }

    private AlertEvidenceResponse toEvidence(AlertEvidence evidence) {
        return new AlertEvidenceResponse(
                evidence.getId(),
                evidence.getMediaUrl(),
                evidence.getMediaType(),
                evidence.getCaption(),
                evidence.getCreatedAt()
        );
    }

    private OccurrenceHistoryResponse toHistory(OccurrenceHistory item) {
        String changedBy = item.getChangedBy() == null ? "Sistema" : item.getChangedBy().getName();
        return new OccurrenceHistoryResponse(
                item.getId(),
                item.getPreviousStatus() == null ? null : item.getPreviousStatus().name(),
                item.getNewStatus().name(),
                item.getNotes(),
                changedBy,
                item.getChangedAt()
        );
    }
}
