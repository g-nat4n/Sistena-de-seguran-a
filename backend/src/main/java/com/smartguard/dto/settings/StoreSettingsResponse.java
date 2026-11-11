package com.smartguard.dto.settings;

import java.time.LocalTime;
import java.util.List;

public record StoreSettingsResponse(
        Long id,
        String name,
        String address,
        String phone,
        LocalTime businessHoursStart,
        LocalTime businessHoursEnd,
        List<DetectionConfigItem> detectionConfigs
) {
}
