package com.smartguard.dto.alert;

import java.time.Instant;

public record AlertEvidenceResponse(
        Long id,
        String mediaUrl,
        String mediaType,
        String caption,
        Instant createdAt
) {
}
