package com.smartguard.dto.simulation;

import com.smartguard.entities.enums.AlertPriority;
import com.smartguard.entities.enums.AlertType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Contrato de ingestão para o módulo Python (simulador agora; YOLO/OpenCV no futuro).
 * Sempre trata o evento como comportamental — nunca como identificação biométrica.
 */
public record IngestDetectionRequest(
        @NotBlank @Size(max = 60) String cameraIdentifier,
        @NotNull AlertType alertType,
        @NotNull AlertPriority priority,
        @NotBlank @Size(max = 500) String description,
        Double confidence,
        boolean simulated,
        @Size(max = 500) String evidenceUrl
) {
}
