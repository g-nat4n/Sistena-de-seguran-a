package com.smartguard.controllers;

import com.smartguard.dto.settings.StoreSettingsResponse;
import com.smartguard.services.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping("/store")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public StoreSettingsResponse storeSettings() {
        return settingsService.getStoreSettings();
    }
}
