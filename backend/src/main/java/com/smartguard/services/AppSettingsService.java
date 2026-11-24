package com.smartguard.services;

import com.smartguard.dto.settings.NotificationSettingsRequest;
import com.smartguard.dto.settings.NotificationSettingsResponse;
import com.smartguard.entities.AppSetting;
import com.smartguard.entities.enums.AlertPriority;
import com.smartguard.repositories.AppSettingRepository;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AppSettingsService {

    public static final String REGISTRATION_OPEN = "registration_open";

    public static final String NOTIFY_TELEGRAM_ENABLED = "notify_telegram_enabled";
    public static final String NOTIFY_TELEGRAM_BOT_TOKEN = "notify_telegram_bot_token";
    public static final String NOTIFY_TELEGRAM_CHAT_IDS = "notify_telegram_chat_ids";
    public static final String NOTIFY_EMAIL_ENABLED = "notify_email_enabled";
    public static final String NOTIFY_SMTP_HOST = "notify_smtp_host";
    public static final String NOTIFY_SMTP_PORT = "notify_smtp_port";
    public static final String NOTIFY_SMTP_USERNAME = "notify_smtp_username";
    public static final String NOTIFY_SMTP_PASSWORD = "notify_smtp_password";
    public static final String NOTIFY_SMTP_STARTTLS = "notify_smtp_starttls";
    public static final String NOTIFY_EMAIL_FROM = "notify_email_from";
    public static final String NOTIFY_EMAIL_TO = "notify_email_to";
    public static final String NOTIFY_MIN_PRIORITY = "notify_min_priority";

    private final AppSettingRepository appSettingRepository;

    @Transactional(readOnly = true)
    public boolean isRegistrationOpen() {
        return "true".equalsIgnoreCase(get(REGISTRATION_OPEN, "false"));
    }

    @Transactional
    public void setRegistrationOpen(boolean open) {
        put(REGISTRATION_OPEN, open ? "true" : "false");
    }

    @Transactional(readOnly = true)
    public NotificationSettingsResponse getNotificationSettings() {
        String token = get(NOTIFY_TELEGRAM_BOT_TOKEN, "");
        String password = get(NOTIFY_SMTP_PASSWORD, "");
        return new NotificationSettingsResponse(
                bool(NOTIFY_TELEGRAM_ENABLED, false),
                maskSecret(token),
                !token.isBlank(),
                get(NOTIFY_TELEGRAM_CHAT_IDS, ""),
                bool(NOTIFY_EMAIL_ENABLED, false),
                get(NOTIFY_SMTP_HOST, ""),
                intVal(NOTIFY_SMTP_PORT, 587),
                get(NOTIFY_SMTP_USERNAME, ""),
                !password.isBlank(),
                bool(NOTIFY_SMTP_STARTTLS, true),
                get(NOTIFY_EMAIL_FROM, ""),
                get(NOTIFY_EMAIL_TO, ""),
                get(NOTIFY_MIN_PRIORITY, "HIGH")
        );
    }

    @Transactional
    public NotificationSettingsResponse saveNotificationSettings(NotificationSettingsRequest request) {
        if (request.telegramEnabled() != null) {
            put(NOTIFY_TELEGRAM_ENABLED, request.telegramEnabled() ? "true" : "false");
        }
        if (request.telegramBotToken() != null && !request.telegramBotToken().isBlank()) {
            put(NOTIFY_TELEGRAM_BOT_TOKEN, request.telegramBotToken().trim());
        }
        if (request.telegramChatIds() != null) {
            put(NOTIFY_TELEGRAM_CHAT_IDS, request.telegramChatIds().trim());
        }
        if (request.emailEnabled() != null) {
            put(NOTIFY_EMAIL_ENABLED, request.emailEnabled() ? "true" : "false");
        }
        if (request.smtpHost() != null) {
            put(NOTIFY_SMTP_HOST, request.smtpHost().trim());
        }
        if (request.smtpPort() != null) {
            put(NOTIFY_SMTP_PORT, String.valueOf(request.smtpPort()));
        }
        if (request.smtpUsername() != null) {
            put(NOTIFY_SMTP_USERNAME, request.smtpUsername().trim());
        }
        if (request.smtpPassword() != null && !request.smtpPassword().isBlank()) {
            put(NOTIFY_SMTP_PASSWORD, request.smtpPassword());
        }
        if (request.smtpStartTls() != null) {
            put(NOTIFY_SMTP_STARTTLS, request.smtpStartTls() ? "true" : "false");
        }
        if (request.emailFrom() != null) {
            put(NOTIFY_EMAIL_FROM, request.emailFrom().trim());
        }
        if (request.emailTo() != null) {
            put(NOTIFY_EMAIL_TO, request.emailTo().trim());
        }
        if (request.minPriority() != null && !request.minPriority().isBlank()) {
            put(NOTIFY_MIN_PRIORITY, normalizePriority(request.minPriority()));
        }
        return getNotificationSettings();
    }

    @Transactional(readOnly = true)
    public boolean shouldNotify(AlertPriority priority) {
        if (priority == null) return false;
        AlertPriority min = parsePriority(get(NOTIFY_MIN_PRIORITY, "HIGH"));
        return priority.ordinal() >= min.ordinal();
    }

    @Transactional(readOnly = true)
    public String telegramBotToken() {
        return get(NOTIFY_TELEGRAM_BOT_TOKEN, "");
    }

    @Transactional(readOnly = true)
    public List<String> telegramChatIds() {
        return splitCsv(get(NOTIFY_TELEGRAM_CHAT_IDS, ""));
    }

    @Transactional(readOnly = true)
    public boolean telegramEnabled() {
        return bool(NOTIFY_TELEGRAM_ENABLED, false);
    }

    @Transactional(readOnly = true)
    public boolean emailEnabled() {
        return bool(NOTIFY_EMAIL_ENABLED, false);
    }

    @Transactional(readOnly = true)
    public String smtpHost() {
        return get(NOTIFY_SMTP_HOST, "");
    }

    @Transactional(readOnly = true)
    public int smtpPort() {
        return intVal(NOTIFY_SMTP_PORT, 587);
    }

    @Transactional(readOnly = true)
    public String smtpUsername() {
        return get(NOTIFY_SMTP_USERNAME, "");
    }

    @Transactional(readOnly = true)
    public String smtpPassword() {
        return get(NOTIFY_SMTP_PASSWORD, "");
    }

    @Transactional(readOnly = true)
    public boolean smtpStartTls() {
        return bool(NOTIFY_SMTP_STARTTLS, true);
    }

    @Transactional(readOnly = true)
    public String emailFrom() {
        return get(NOTIFY_EMAIL_FROM, "");
    }

    @Transactional(readOnly = true)
    public List<String> emailRecipients() {
        return splitCsv(get(NOTIFY_EMAIL_TO, ""));
    }

    private String get(String key, String fallback) {
        return appSettingRepository.findById(key)
                .map(AppSetting::getValue)
                .filter(v -> v != null)
                .orElse(fallback);
    }

    private void put(String key, String value) {
        AppSetting setting = appSettingRepository.findById(key)
                .orElse(AppSetting.builder().key(key).value(value == null ? "" : value).build());
        setting.setValue(value == null ? "" : value);
        appSettingRepository.save(setting);
    }

    private boolean bool(String key, boolean fallback) {
        String raw = get(key, fallback ? "true" : "false");
        return "true".equalsIgnoreCase(raw) || "1".equals(raw) || "yes".equalsIgnoreCase(raw);
    }

    private int intVal(String key, int fallback) {
        try {
            return Integer.parseInt(get(key, String.valueOf(fallback)).trim());
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private static List<String> splitCsv(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split("[,;\\s]+"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .toList();
    }

    private static String maskSecret(String value) {
        if (value == null || value.isBlank()) return "";
        if (value.length() <= 8) return "********";
        return value.substring(0, 4) + "…" + value.substring(value.length() - 4);
    }

    private static String normalizePriority(String raw) {
        try {
            return AlertPriority.valueOf(raw.trim().toUpperCase(Locale.ROOT)).name();
        } catch (Exception ex) {
            return "HIGH";
        }
    }

    private static AlertPriority parsePriority(String raw) {
        try {
            return AlertPriority.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            return AlertPriority.HIGH;
        }
    }
}
