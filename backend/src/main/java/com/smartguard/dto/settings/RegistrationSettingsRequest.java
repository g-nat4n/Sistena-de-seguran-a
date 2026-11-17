package com.smartguard.dto.settings;

import jakarta.validation.constraints.NotNull;

public record RegistrationSettingsRequest(@NotNull Boolean open) {
}
