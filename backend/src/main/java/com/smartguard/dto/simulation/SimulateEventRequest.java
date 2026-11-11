package com.smartguard.dto.simulation;

import com.smartguard.entities.enums.AlertPriority;
import com.smartguard.entities.enums.AlertType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SimulateEventRequest(
        @NotNull AlertType type,
        AlertPriority priority,
        Long cameraId,
        @Size(max = 500) String description,
        @Size(max = 500) String evidenceUrl
) {
}
