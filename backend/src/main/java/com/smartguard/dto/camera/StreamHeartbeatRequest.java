package com.smartguard.dto.camera;

import com.smartguard.entities.enums.StreamState;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StreamHeartbeatRequest(
        @NotNull StreamState streamState,
        @Size(max = 500) String lastError
) {
}
