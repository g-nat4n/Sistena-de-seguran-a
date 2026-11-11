package com.smartguard.dto.settings;

public record DetectionConfigItem(
        Long id,
        String alertType,
        String alertTypeLabel,
        String defaultPriority,
        boolean enabled,
        String monitoringArea,
        String notes
) {
}
