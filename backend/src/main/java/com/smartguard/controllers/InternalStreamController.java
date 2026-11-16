package com.smartguard.controllers;

import com.smartguard.dto.camera.StreamHeartbeatRequest;
import com.smartguard.services.CameraRtspService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Endpoints internos para o worker Python. Protegidos por token de serviço.
 */
@RestController
@RequestMapping("/api/internal/cameras")
@RequiredArgsConstructor
public class InternalStreamController {

    private final CameraRtspService cameraRtspService;

    @Value("${smartguard.vision.service-token}")
    private String serviceToken;

    @PostMapping("/{id}/heartbeat")
    public Map<String, String> heartbeat(
            @PathVariable Long id,
            @RequestHeader(value = "X-Service-Token", required = false) String token,
            @Valid @RequestBody StreamHeartbeatRequest request
    ) {
        assertServiceToken(token);
        cameraRtspService.heartbeat(id, request);
        return Map.of("status", "ok");
    }

    @PostMapping("/{id}/rtsp-url")
    public Map<String, String> resolveRtspUrl(
            @PathVariable Long id,
            @RequestHeader(value = "X-Service-Token", required = false) String token
    ) {
        assertServiceToken(token);
        return Map.of("rtspUrl", cameraRtspService.resolveAuthenticatedRtspUrl(id));
    }

    private void assertServiceToken(String token) {
        if (token == null || !token.equals(serviceToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token de serviço inválido");
        }
    }
}
