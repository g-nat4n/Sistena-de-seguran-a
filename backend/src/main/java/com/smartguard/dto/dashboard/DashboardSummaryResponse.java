package com.smartguard.dto.dashboard;

import java.util.List;

public record DashboardSummaryResponse(
        long totalCameras,
        long onlineCameras,
        long offlineCameras,
        long alertsToday,
        long underReview,
        long confirmed,
        String monitoringStatus,
        List<HourlyAlertPoint> alertsByHour,
        List<AlertTypeCount> alertsByType,
        List<RecentAlertItem> recentAlerts
) {
}
