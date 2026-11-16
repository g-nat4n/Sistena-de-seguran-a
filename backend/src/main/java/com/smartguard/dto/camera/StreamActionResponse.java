package com.smartguard.dto.camera;

public record StreamActionResponse(
        Long cameraId,
        String streamState,
        boolean success,
        String message
) {
}
