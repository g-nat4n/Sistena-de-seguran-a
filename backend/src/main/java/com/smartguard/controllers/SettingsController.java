package com.smartguard.controllers;

import com.smartguard.dto.settings.RegistrationSettingsRequest;
import com.smartguard.dto.settings.StoreSettingsResponse;
import com.smartguard.services.AppSettingsService;
import com.smartguard.services.AuditService;
import com.smartguard.services.SettingsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;
    private final AppSettingsService appSettingsService;
    private final AuditService auditService;

    @GetMapping("/store")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public StoreSettingsResponse storeSettings() {
        return settingsService.getStoreSettings();
    }

    @GetMapping("/registration")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> registrationStatus() {
        return Map.of("open", appSettingsService.isRegistrationOpen());
    }

    @PutMapping("/registration")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> updateRegistration(
            @Valid @RequestBody RegistrationSettingsRequest request,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest http
    ) {
        appSettingsService.setRegistrationOpen(Boolean.TRUE.equals(request.open()));
        auditService.record(
                "REGISTRATION_TOGGLED",
                principal.getUsername(),
                "registration_open=" + request.open(),
                http.getRemoteAddr()
        );
        return Map.of("open", appSettingsService.isRegistrationOpen());
    }
}
