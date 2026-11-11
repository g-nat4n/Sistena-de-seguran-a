package com.smartguard.repositories;

import com.smartguard.entities.DetectionConfiguration;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DetectionConfigurationRepository extends JpaRepository<DetectionConfiguration, Long> {
    List<DetectionConfiguration> findByStoreId(Long storeId);
}
