package com.smartguard.dto.settings;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record NotificationSettingsRequest(
        Boolean telegramEnabled,
        @Size(max = 200) String telegramBotToken,
        @Size(max = 500) String telegramChatIds,
        Boolean emailEnabled,
        @Size(max = 200) String smtpHost,
        @Min(1) @Max(65535) Integer smtpPort,
        @Size(max = 200) String smtpUsername,
        @Size(max = 200) String smtpPassword,
        Boolean smtpStartTls,
        @Size(max = 200) String emailFrom,
        @Size(max = 500) String emailTo,
        @Size(max = 20) String minPriority
) {
}
