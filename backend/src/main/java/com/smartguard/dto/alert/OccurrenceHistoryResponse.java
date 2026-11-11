package com.smartguard.dto.alert;

import java.time.Instant;

public record OccurrenceHistoryResponse(
        Long id,
        String previousStatus,
        String newStatus,
        String notes,
        String changedByName,
        Instant changedAt
) {
}
