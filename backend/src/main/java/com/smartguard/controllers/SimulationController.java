package com.smartguard.controllers;

import com.smartguard.dto.alert.AlertResponse;
import com.smartguard.dto.simulation.IngestDetectionRequest;
import com.smartguard.dto.simulation.SimulateEventRequest;
import com.smartguard.services.SimulationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/simulation")
@RequiredArgsConstructor
public class SimulationController {

    private final SimulationService simulationService;

    @PostMapping("/events")
    @ResponseStatus(HttpStatus.CREATED)
    public AlertResponse simulate(@Valid @RequestBody SimulateEventRequest request) {
        return simulationService.simulate(request);
    }

    @PostMapping("/events/batch")
    @ResponseStatus(HttpStatus.CREATED)
    public List<AlertResponse> simulateBatch(@RequestParam(defaultValue = "3") int quantity) {
        return simulationService.simulateBatch(quantity);
    }

    /**
     * Endpoint de integração para o módulo Python.
     * No MVP recebe eventos simulados; no futuro receberá saídas do YOLO/OpenCV.
     */
    @PostMapping("/ingest")
    @ResponseStatus(HttpStatus.CREATED)
    public AlertResponse ingest(@Valid @RequestBody IngestDetectionRequest request) {
        return simulationService.ingest(request);
    }

    @GetMapping("/info")
    public Map<String, Object> info() {
        return Map.of(
                "mode", "simulated",
                "facialRecognition", false,
                "disclaimer", "Eventos gerados aqui são simulados e não representam detecções reais."
        );
    }
}
