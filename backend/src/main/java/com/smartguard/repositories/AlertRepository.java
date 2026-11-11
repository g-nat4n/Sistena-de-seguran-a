package com.smartguard.repositories;

import com.smartguard.entities.Alert;
import com.smartguard.entities.enums.AlertStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AlertRepository extends JpaRepository<Alert, Long>, JpaSpecificationExecutor<Alert> {

    Optional<Alert> findByPublicId(String publicId);

    long countByOccurredAtBetween(Instant start, Instant end);

    long countByStatus(AlertStatus status);

    List<Alert> findTop10ByOrderByOccurredAtDesc();

    @Query("""
            SELECT a FROM Alert a
            JOIN FETCH a.camera
            WHERE a.id = :id
            """)
    Optional<Alert> findDetailedById(@Param("id") Long id);

    @Query(value = """
            SELECT TO_CHAR(date_trunc('hour', occurred_at), 'HH24:00') AS hour_label,
                   COUNT(*) AS total
            FROM alerts
            WHERE occurred_at >= :start AND occurred_at < :end
            GROUP BY date_trunc('hour', occurred_at)
            ORDER BY date_trunc('hour', occurred_at)
            """, nativeQuery = true)
    List<Object[]> countGroupedByHour(@Param("start") Instant start, @Param("end") Instant end);

    @Query("""
            SELECT a.type, COUNT(a)
            FROM Alert a
            WHERE a.occurredAt >= :start
            GROUP BY a.type
            ORDER BY COUNT(a) DESC
            """)
    List<Object[]> countGroupedByType(@Param("start") Instant start);
}
