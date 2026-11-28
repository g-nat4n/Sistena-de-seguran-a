package com.smartguard.services;

import com.smartguard.entities.Alert;
import com.smartguard.entities.AlertEvidence;
import com.smartguard.entities.Camera;
import com.smartguard.entities.enums.AlertPriority;
import com.smartguard.repositories.AlertEvidenceRepository;
import com.smartguard.runtime.AppPaths;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertNotifyService {

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss").withZone(ZoneId.systemDefault());

    private final AppSettingsService appSettingsService;
    private final TelegramNotifyService telegramNotifyService;
    private final EmailNotifyService emailNotifyService;
    private final AlertLabelMapper alertLabelMapper;
    private final AlertEvidenceRepository alertEvidenceRepository;
    private final AppPaths appPaths;

    @Async
    public void notifyNewAlert(Alert alert, Camera camera) {
        try {
            if (alert == null || alert.getPriority() == null) return;
            if (!appSettingsService.shouldNotify(alert.getPriority())) return;
            if (!appSettingsService.telegramEnabled() && !appSettingsService.emailEnabled()) return;

            String body = buildBody(alert, camera);
            String subject = "[SmartGuard] " + alert.getPriority() + " · " + alert.getPublicId();

            if (appSettingsService.telegramEnabled()) {
                Optional<LocalMedia> media = resolveLocalMedia(alert.getId());
                if (media.isPresent()) {
                    LocalMedia m = media.get();
                    telegramNotifyService.sendMedia(body, m.path(), m.video());
                } else {
                    telegramNotifyService.send(body);
                }
            }
            if (appSettingsService.emailEnabled()) {
                emailNotifyService.send(subject, body);
            }
        } catch (Exception ex) {
            log.warn("Falha ao notificar alerta {}: {}", alert != null ? alert.getPublicId() : "?", ex.toString());
        }
    }

    public List<String> sendTest(AlertPriority priority) {
        List<String> results = new ArrayList<>();
        String body = """
                ⚠ ATENÇÃO — teste SmartGuard
                Prioridade: %s
                Se você recebeu isto, a configuração está OK.
                """.formatted(priority == null ? "HIGH" : priority.name());
        String subject = "[SmartGuard] Teste de alerta " + (priority == null ? "HIGH" : priority.name());

        if (appSettingsService.telegramEnabled()) {
            results.addAll(telegramNotifyService.send(body));
        } else {
            results.add("Telegram desligado");
        }
        if (appSettingsService.emailEnabled()) {
            results.addAll(emailNotifyService.send(subject, body));
        } else {
            results.add("E-mail desligado");
        }
        return results;
    }

    private Optional<LocalMedia> resolveLocalMedia(Long alertId) {
        if (alertId == null) {
            return Optional.empty();
        }
        List<AlertEvidence> evidences = alertEvidenceRepository.findByAlertId(alertId);
        if (evidences.isEmpty()) {
            return Optional.empty();
        }

        Optional<LocalMedia> video = evidences.stream()
                .sorted(Comparator.comparing(AlertEvidence::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::toLocalMedia)
                .flatMap(Optional::stream)
                .filter(LocalMedia::video)
                .findFirst();
        if (video.isPresent()) {
            return video;
        }

        return evidences.stream()
                .sorted(Comparator.comparing(AlertEvidence::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::toLocalMedia)
                .flatMap(Optional::stream)
                .findFirst();
    }

    private Optional<LocalMedia> toLocalMedia(AlertEvidence evidence) {
        if (evidence == null || evidence.getMediaUrl() == null || evidence.getMediaUrl().isBlank()) {
            return Optional.empty();
        }
        String filename = filenameFromUrl(evidence.getMediaUrl());
        if (filename == null) {
            return Optional.empty();
        }
        Path path = appPaths.evidenceDir().resolve(filename).normalize();
        if (!path.startsWith(appPaths.evidenceDir().normalize()) || !Files.isRegularFile(path)) {
            return Optional.empty();
        }
        boolean video = isVideo(evidence.getMediaType(), filename);
        return Optional.of(new LocalMedia(path, video));
    }

    private static String filenameFromUrl(String mediaUrl) {
        String raw = mediaUrl.trim();
        int q = raw.indexOf('?');
        if (q >= 0) {
            raw = raw.substring(0, q);
        }
        int slash = Math.max(raw.lastIndexOf('/'), raw.lastIndexOf('\\'));
        String name = slash >= 0 ? raw.substring(slash + 1) : raw;
        if (name.isBlank() || name.contains("..")) {
            return null;
        }
        return name;
    }

    private static boolean isVideo(String mediaType, String filename) {
        String type = mediaType == null ? "" : mediaType.toLowerCase(Locale.ROOT);
        String lower = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
        return type.contains("video")
                || lower.endsWith(".mp4")
                || lower.endsWith(".webm")
                || lower.contains("_clip_");
    }

    private String buildBody(Alert alert, Camera camera) {
        String typeLabel = alertLabelMapper.toLabel(alert.getType());
        String cameraName = camera != null ? camera.getName() : "?";
        String location = camera != null ? camera.getLocation() : "";
        return """
                ⚠ ATENÇÃO — SmartGuard
                Alerta: %s
                Tipo: %s
                Prioridade: %s
                Câmera: %s%s
                Quando: %s
                %s
                """.formatted(
                alert.getPublicId(),
                typeLabel,
                alert.getPriority(),
                cameraName,
                (location == null || location.isBlank()) ? "" : " (" + location + ")",
                alert.getOccurredAt() == null ? "-" : FMT.format(alert.getOccurredAt()),
                alert.getDescription() == null ? "" : alert.getDescription()
        ).trim();
    }

    private record LocalMedia(Path path, boolean video) {
    }
}
