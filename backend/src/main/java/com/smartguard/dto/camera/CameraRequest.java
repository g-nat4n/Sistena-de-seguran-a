package com.smartguard.dto.camera;

import com.smartguard.entities.enums.CameraStatus;
import com.smartguard.entities.enums.CameraType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CameraRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 60) String identifier,
        @NotBlank @Size(max = 120) String location,
        @NotNull CameraType type,
        @Size(max = 500) String description,
        @NotNull CameraStatus status,
        @Size(max = 500) String demoMediaUrl
) {
}
