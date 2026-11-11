package com.smartguard.services;

import com.smartguard.dto.settings.DetectionConfigItem;
import com.smartguard.dto.settings.StoreSettingsResponse;
import com.smartguard.entities.Store;
import com.smartguard.exceptions.ResourceNotFoundException;
import com.smartguard.repositories.DetectionConfigurationRepository;
import com.smartguard.repositories.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final StoreRepository storeRepository;
    private final DetectionConfigurationRepository detectionConfigurationRepository;
    private final AlertLabelMapper alertLabelMapper;

    @Transactional(readOnly = true)
    public StoreSettingsResponse getStoreSettings() {
        Store store = storeRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Loja não encontrada"));

        var configs = detectionConfigurationRepository.findByStoreId(store.getId()).stream()
                .map(cfg -> new DetectionConfigItem(
                        cfg.getId(),
                        cfg.getAlertType().name(),
                        alertLabelMapper.toLabel(cfg.getAlertType()),
                        cfg.getDefaultPriority().name(),
                        cfg.isEnabled(),
                        cfg.getMonitoringArea(),
                        cfg.getNotes()
                ))
                .toList();

        return new StoreSettingsResponse(
                store.getId(),
                store.getName(),
                store.getAddress(),
                store.getPhone(),
                store.getBusinessHoursStart(),
                store.getBusinessHoursEnd(),
                configs
        );
    }
}
