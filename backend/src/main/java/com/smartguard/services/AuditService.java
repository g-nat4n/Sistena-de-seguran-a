package com.smartguard.services;

import com.smartguard.entities.AuditLog;
import com.smartguard.repositories.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void record(String action, String actorEmail, String details, String ipAddress) {
        auditLogRepository.save(AuditLog.builder()
                .action(action)
                .actorEmail(actorEmail)
                .details(details == null ? null : details.substring(0, Math.min(details.length(), 1000)))
                .ipAddress(ipAddress)
                .build());
    }

    @Transactional(readOnly = true)
    public java.util.List<AuditLog> recent(int limit) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, Math.max(1, Math.min(limit, 200))));
    }
}
