package com.smartguard.dto.simulation;

import com.smartguard.entities.enums.AlertPriority;
import com.smartguard.entities.enums.AlertType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Contrato de ingestão do Vision Service (YOLO/RTSP) e do simulador Python.
 * Sempre comportamental e anônimo — nunca identificação biométrica.
 */
public record IngestDetectionRequest(
        @NotBlank @Size(max = 60) String cameraIdentifier,
        @NotNull AlertType alertType,
        @NotNull AlertPriority priority,
        @NotBlank @Size(max = 500) String description,
        Double confidence,
        boolean simulated,
        @Size(max = 1000) String evidenceUrl,
        @Size(max = 1000) String evidenceClipUrl
) {
}
