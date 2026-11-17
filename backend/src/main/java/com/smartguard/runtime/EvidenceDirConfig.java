package com.smartguard.runtime;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class EvidenceDirConfig {

    private final AppPaths appPaths;

    @Value("${smartguard.evidence.dir:}")
    private String evidenceDirProp;

    public EvidenceDirConfig(AppPaths appPaths) {
        this.appPaths = appPaths;
    }

    @PostConstruct
    void applyDefaultEvidenceDir() {
        if (evidenceDirProp == null || evidenceDirProp.isBlank()) {
            System.setProperty("smartguard.evidence.dir", appPaths.evidenceDir().toString());
        }
    }
}
