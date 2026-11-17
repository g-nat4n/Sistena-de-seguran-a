package com.smartguard.controllers;

import com.smartguard.services.ServerStatusService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final ServerStatusService serverStatusService;

    @GetMapping
    public Map<String, Object> health() {
        return serverStatusService.health();
    }
}
