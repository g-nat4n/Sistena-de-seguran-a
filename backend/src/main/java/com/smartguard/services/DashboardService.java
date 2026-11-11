package com.smartguard.services;

import com.smartguard.dto.dashboard.AlertTypeCount;
import com.smartguard.dto.dashboard.DashboardSummaryResponse;
import com.smartguard.dto.dashboard.HourlyAlertPoint;
import com.smartguard.dto.dashboard.RecentAlertItem;
import com.smartguard.entities.Alert;
import com.smartguard.entities.enums.AlertStatus;
import com.smartguard.entities.enums.AlertType;
import com.smartguard.entities.enums.CameraStatus;
import com.smartguard.repositories.AlertRepository;
import com.smartguard.repositories.CameraRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CameraRepository cameraRepository;
    private final AlertRepository alertRepository;
    private final AlertLabelMapper alertLabelMapper;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary() {
        long totalCameras = cameraRepository.count();
        long onlineCameras = cameraRepository.countByStatus(CameraStatus.ONLINE);
        long offlineCameras = cameraRepository.countByStatus(CameraStatus.OFFLINE)
                + cameraRepository.countByStatus(CameraStatus.MAINTENANCE);

        Instant dayStart = LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant dayEnd = dayStart.plusSeconds(24 * 60 * 60);

        long alertsToday = alertRepository.countByOccurredAtBetween(dayStart, dayEnd);
        long underReview = alertRepository.countByStatus(AlertStatus.UNDER_REVIEW);
        long confirmed = alertRepository.countByStatus(AlertStatus.CONFIRMED);

        String monitoringStatus = resolveMonitoringStatus(onlineCameras, totalCameras, alertsToday);

        List<HourlyAlertPoint> alertsByHour = buildHourlySeries(dayStart, dayEnd);
        List<AlertTypeCount> alertsByType = buildTypeSeries(dayStart.minusSeconds(7L * 24 * 60 * 60));
        List<RecentAlertItem> recentAlerts = alertRepository.findTop10ByOrderByOccurredAtDesc().stream()
                .map(this::toRecentItem)
                .toList();

        return new DashboardSummaryResponse(
                totalCameras,
                onlineCameras,
                offlineCameras,
                alertsToday,
                underReview,
                confirmed,
                monitoringStatus,
                alertsByHour,
                alertsByType,
                recentAlerts
        );
    }

    private String resolveMonitoringStatus(long online, long total, long alertsToday) {
        if (total == 0) {
            return "SEM_CAMERAS";
        }
        if (online == 0) {
            return "OFFLINE";
        }
        if (alertsToday >= 5) {
            return "ATENCAO";
        }
        if (online < total) {
            return "PARCIAL";
        }
        return "OPERACIONAL";
    }

    private List<HourlyAlertPoint> buildHourlySeries(Instant dayStart, Instant dayEnd) {
        Map<String, Long> buckets = new LinkedHashMap<>();
        for (int hour = 0; hour < 24; hour++) {
            buckets.put(String.format("%02d:00", hour), 0L);
        }

        for (Object[] row : alertRepository.countGroupedByHour(dayStart, dayEnd)) {
            String hour = String.valueOf(row[0]);
            long count = ((Number) row[1]).longValue();
            buckets.put(hour, count);
        }

        List<HourlyAlertPoint> points = new ArrayList<>();
        buckets.forEach((hour, count) -> points.add(new HourlyAlertPoint(hour, count)));
        return points;
    }

    private List<AlertTypeCount> buildTypeSeries(Instant since) {
        List<AlertTypeCount> result = new ArrayList<>();
        for (Object[] row : alertRepository.countGroupedByType(since)) {
            AlertType type = (AlertType) row[0];
            long count = ((Number) row[1]).longValue();
            result.add(new AlertTypeCount(type.name(), alertLabelMapper.toLabel(type), count));
        }
        return result;
    }

    private RecentAlertItem toRecentItem(Alert alert) {
        return new RecentAlertItem(
                alert.getId(),
                alert.getPublicId(),
                alert.getType().name(),
                alertLabelMapper.toLabel(alert.getType()),
                alert.getPriority().name(),
                alert.getStatus().name(),
                alert.getCamera().getName(),
                alert.getCamera().getLocation(),
                alert.getDescription(),
                alert.isSimulated(),
                alert.getOccurredAt()
        );
    }
}
