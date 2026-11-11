package com.smartguard.dto.camera;

import java.time.Instant;

public record CameraResponse(
        Long id,
        String name,
        String identifier,
        String location,
        String type,
        String description,
        String status,
        String demoMediaUrl,
        boolean rtspConfigured,
        Instant updatedAt
) {
}
