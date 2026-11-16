package com.smartguard.controllers;

import com.smartguard.dto.alert.AlertResponse;
import com.smartguard.dto.simulation.IngestDetectionRequest;
import com.smartguard.services.SimulationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Ingestão de detecções do Vision Service (YOLO/RTSP).
 * Protegido por token de serviço — sem JWT de usuário.
 */
@RestController
@RequestMapping("/api/internal/detections")
@RequiredArgsConstructor
public class InternalDetectionController {

    private final SimulationService simulationService;

    @Value("${smartguard.vision.service-token}")
    private String serviceToken;

    @PostMapping("/ingest")
    @ResponseStatus(HttpStatus.CREATED)
    public AlertResponse ingest(
            @RequestHeader(value = "X-Service-Token", required = false) String token,
            @Valid @RequestBody IngestDetectionRequest request
    ) {
        if (token == null || !token.equals(serviceToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token de serviço inválido");
        }
        return simulationService.ingest(request);
    }
}
