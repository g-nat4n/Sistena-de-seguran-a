package com.smartguard.controllers;

import com.smartguard.dto.settings.NotificationSettingsRequest;
import com.smartguard.dto.settings.NotificationSettingsResponse;
import com.smartguard.dto.settings.RegistrationSettingsRequest;
import com.smartguard.dto.settings.StoreSettingsResponse;
import com.smartguard.entities.enums.AlertPriority;
import com.smartguard.services.AlertNotifyService;
import com.smartguard.services.AppSettingsService;
import com.smartguard.services.AuditService;
import com.smartguard.services.SettingsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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
    private final AlertNotifyService alertNotifyService;
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

    @GetMapping("/notifications")
    @PreAuthorize("hasRole('ADMIN')")
    public NotificationSettingsResponse notificationSettings() {
        return appSettingsService.getNotificationSettings();
    }

    @PutMapping("/notifications")
    @PreAuthorize("hasRole('ADMIN')")
    public NotificationSettingsResponse updateNotifications(
            @Valid @RequestBody NotificationSettingsRequest request,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest http
    ) {
        NotificationSettingsResponse saved = appSettingsService.saveNotificationSettings(request);
        auditService.record(
                "NOTIFY_SETTINGS_UPDATED",
                principal.getUsername(),
                "telegram=" + saved.telegramEnabled() + " email=" + saved.emailEnabled()
                        + " min=" + saved.minPriority(),
                http.getRemoteAddr()
        );
        return saved;
    }

    @PostMapping("/notifications/test")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> testNotifications(@AuthenticationPrincipal UserDetails principal, HttpServletRequest http) {
        List<String> results = alertNotifyService.sendTest(AlertPriority.HIGH);
        auditService.record(
                "NOTIFY_TEST",
                principal.getUsername(),
                String.join(" | ", results),
                http.getRemoteAddr()
        );
        return Map.of("ok", true, "results", results);
    }
}
