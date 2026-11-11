package com.smartguard.dto.alert;

import com.smartguard.entities.enums.AlertStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateAlertStatusRequest(
        @NotNull AlertStatus status,
        @Size(max = 500) String notes
) {
}
