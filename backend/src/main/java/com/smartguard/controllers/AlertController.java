package com.smartguard.controllers;

import com.smartguard.dto.alert.AlertResponse;
import com.smartguard.dto.alert.UpdateAlertStatusRequest;
import com.smartguard.entities.enums.AlertPriority;
import com.smartguard.entities.enums.AlertStatus;
import com.smartguard.entities.enums.AlertType;
import com.smartguard.services.AlertService;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public List<AlertResponse> search(
            @RequestParam(required = false) AlertType type,
            @RequestParam(required = false) AlertPriority priority,
            @RequestParam(required = false) AlertStatus status,
            @RequestParam(required = false) Long cameraId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) String search
    ) {
        return alertService.search(type, priority, status, cameraId, from, to, search);
    }

    @GetMapping("/{id}")
    public AlertResponse get(@PathVariable Long id) {
        return alertService.getById(id);
    }

    @PatchMapping("/{id}/status")
    public AlertResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAlertStatusRequest request
    ) {
        return alertService.updateStatus(id, request);
    }
}
