package com.smartguard.dto.settings;

public record NotificationSettingsResponse(
        boolean telegramEnabled,
        String telegramBotTokenMasked,
        boolean telegramBotTokenSet,
        String telegramChatIds,
        boolean emailEnabled,
        String smtpHost,
        int smtpPort,
        String smtpUsername,
        boolean smtpPasswordSet,
        boolean smtpStartTls,
        String emailFrom,
        String emailTo,
        String minPriority
) {
}
