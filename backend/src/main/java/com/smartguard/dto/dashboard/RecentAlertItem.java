package com.smartguard.dto.dashboard;

import java.time.Instant;

public record RecentAlertItem(
        Long id,
        String publicId,
        String type,
        String typeLabel,
        String priority,
        String status,
        String cameraName,
        String location,
        String description,
        boolean simulated,
        Instant occurredAt
) {
}
