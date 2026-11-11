package com.smartguard.dto.alert;

import java.time.Instant;
import java.util.List;

public record AlertResponse(
        Long id,
        String publicId,
        String type,
        String typeLabel,
        String priority,
        String status,
        String description,
        boolean simulated,
        Instant occurredAt,
        Instant updatedAt,
        Long cameraId,
        String cameraName,
        String cameraLocation,
        String cameraIdentifier,
        String evidenceUrl,
        List<AlertEvidenceResponse> evidences,
        List<OccurrenceHistoryResponse> history
) {
}
