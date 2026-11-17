package com.smartguard.services;

import com.smartguard.entities.AppSetting;
import com.smartguard.repositories.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AppSettingsService {

    public static final String REGISTRATION_OPEN = "registration_open";

    private final AppSettingRepository appSettingRepository;

    @Transactional(readOnly = true)
    public boolean isRegistrationOpen() {
        return appSettingRepository.findById(REGISTRATION_OPEN)
                .map(s -> "true".equalsIgnoreCase(s.getValue()))
                .orElse(false);
    }

    @Transactional
    public void setRegistrationOpen(boolean open) {
        AppSetting setting = appSettingRepository.findById(REGISTRATION_OPEN)
                .orElse(AppSetting.builder().key(REGISTRATION_OPEN).value("false").build());
        setting.setValue(open ? "true" : "false");
        appSettingRepository.save(setting);
    }
}
