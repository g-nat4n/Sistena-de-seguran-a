package com.smartguard.repositories;

import com.smartguard.entities.AlertEvidence;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertEvidenceRepository extends JpaRepository<AlertEvidence, Long> {
    List<AlertEvidence> findByAlertId(Long alertId);
}
