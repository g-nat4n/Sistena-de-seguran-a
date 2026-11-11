package com.smartguard.services;

import com.smartguard.dto.alert.AlertResponse;
import com.smartguard.dto.simulation.IngestDetectionRequest;
import com.smartguard.dto.simulation.SimulateEventRequest;
import com.smartguard.entities.Alert;
import com.smartguard.entities.AlertEvidence;
import com.smartguard.entities.Camera;
import com.smartguard.entities.OccurrenceHistory;
import com.smartguard.entities.enums.AlertPriority;
import com.smartguard.entities.enums.AlertStatus;
import com.smartguard.entities.enums.AlertType;
import com.smartguard.exceptions.BusinessException;
import com.smartguard.exceptions.ResourceNotFoundException;
import com.smartguard.repositories.AlertEvidenceRepository;
import com.smartguard.repositories.AlertRepository;
import com.smartguard.repositories.CameraRepository;
import com.smartguard.repositories.OccurrenceHistoryRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SimulationService {

    private final CameraRepository cameraRepository;
    private final AlertRepository alertRepository;
    private final AlertEvidenceRepository alertEvidenceRepository;
    private final OccurrenceHistoryRepository occurrenceHistoryRepository;
    private final AlertService alertService;
    private final AlertLabelMapper alertLabelMapper;

    @Transactional
    public AlertResponse simulate(SimulateEventRequest request) {
        Camera camera = resolveCamera(request.cameraId());
        AlertType type = request.type();
        AlertPriority priority = request.priority() == null ? defaultPriority(type) : request.priority();
        String description = request.description() == null || request.description().isBlank()
                ? defaultDescription(type, camera)
                : request.description().trim();
        String evidenceUrl = request.evidenceUrl() == null || request.evidenceUrl().isBlank()
                ? camera.getDemoMediaUrl()
                : request.evidenceUrl().trim();

        return persistSimulatedAlert(camera, type, priority, description, evidenceUrl, true);
    }

    @Transactional
    public AlertResponse ingest(IngestDetectionRequest request) {
        Camera camera = cameraRepository.findByIdentifier(request.cameraIdentifier())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Câmera não encontrada para identifier: " + request.cameraIdentifier()));

        String description = request.description().trim();
        if (request.confidence() != null) {
            description = description + " (confiança informada: "
                    + String.format("%.2f", request.confidence()) + ")";
        }

        return persistSimulatedAlert(
                camera,
                request.alertType(),
                request.priority(),
                description,
                request.evidenceUrl() == null || request.evidenceUrl().isBlank()
                        ? camera.getDemoMediaUrl()
                        : request.evidenceUrl().trim(),
                request.simulated()
        );
    }

    @Transactional
    public List<AlertResponse> simulateBatch(int quantity) {
        int safeQuantity = Math.max(1, Math.min(quantity, 10));
        List<AlertType> types = List.of(AlertType.values());
        List<AlertResponse> created = new java.util.ArrayList<>();
        for (int i = 0; i < safeQuantity; i++) {
            AlertType type = types.get(ThreadLocalRandom.current().nextInt(types.size()));
            created.add(simulate(new SimulateEventRequest(type, null, null, null, null)));
        }
        return created;
    }

    private AlertResponse persistSimulatedAlert(
            Camera camera,
            AlertType type,
            AlertPriority priority,
            String description,
            String evidenceUrl,
            boolean simulated
    ) {
        Alert alert = Alert.builder()
                .publicId(nextPublicId())
                .type(type)
                .priority(priority)
                .status(AlertStatus.NEW)
                .description(description)
                .occurredAt(Instant.now())
                .simulated(simulated)
                .camera(camera)
                .build();

        Alert saved = alertRepository.save(alert);

        alertEvidenceRepository.save(AlertEvidence.builder()
                .alert(saved)
                .mediaUrl(evidenceUrl == null ? "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800" : evidenceUrl)
                .mediaType("image")
                .caption("Evidência ilustrativa (" + (simulated ? "simulada" : "integrada") + ") — "
                        + alertLabelMapper.toLabel(type))
                .build());

        occurrenceHistoryRepository.save(OccurrenceHistory.builder()
                .alert(saved)
                .previousStatus(null)
                .newStatus(AlertStatus.NEW)
                .notes(simulated
                        ? "Evento gerado pelo simulador. Não representa detecção real."
                        : "Evento recebido via integração do módulo de IA.")
                .build());

        return alertService.getById(saved.getId());
    }

    private Camera resolveCamera(Long cameraId) {
        if (cameraId != null) {
            return cameraRepository.findById(cameraId)
                    .orElseThrow(() -> new ResourceNotFoundException("Câmera não encontrada: " + cameraId));
        }
        List<Camera> cameras = cameraRepository.findAllByOrderByNameAsc();
        if (cameras.isEmpty()) {
            throw new BusinessException("Não há câmeras cadastradas para simular eventos.");
        }
        return cameras.get(ThreadLocalRandom.current().nextInt(cameras.size()));
    }

    private String nextPublicId() {
        String year = String.valueOf(LocalDate.now(ZoneOffset.UTC).getYear());
        long seq = alertRepository.count() + 1;
        return String.format("ALT-%s-%04d", year, seq);
    }

    private AlertPriority defaultPriority(AlertType type) {
        return switch (type) {
            case RESTRICTED_AREA_ENTRY -> AlertPriority.CRITICAL;
            case POSSIBLE_CONCEALMENT, AFTER_HOURS_MOVEMENT -> AlertPriority.HIGH;
            case SUSPICIOUS_MOVEMENT, UNUSUAL_DWELL -> AlertPriority.MEDIUM;
        };
    }

    private String defaultDescription(AlertType type, Camera camera) {
        return "Evento simulado: " + alertLabelMapper.toLabel(type)
                + " detectado na câmera " + camera.getName()
                + " (" + camera.getLocation() + "). Não é uma detecção real.";
    }
}
