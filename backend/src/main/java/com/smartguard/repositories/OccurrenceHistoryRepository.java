package com.smartguard.repositories;

import com.smartguard.entities.OccurrenceHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OccurrenceHistoryRepository extends JpaRepository<OccurrenceHistory, Long> {
    List<OccurrenceHistory> findByAlertIdOrderByChangedAtDesc(Long alertId);
}
