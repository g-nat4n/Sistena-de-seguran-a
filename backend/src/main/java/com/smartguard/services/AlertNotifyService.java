package com.smartguard.services;

import com.smartguard.entities.Alert;
import com.smartguard.entities.Camera;
import com.smartguard.entities.enums.AlertPriority;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
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

    @Async
    public void notifyNewAlert(Alert alert, Camera camera) {
        try {
            if (alert == null || alert.getPriority() == null) return;
            if (!appSettingsService.shouldNotify(alert.getPriority())) return;
            if (!appSettingsService.telegramEnabled() && !appSettingsService.emailEnabled()) return;

            String body = buildBody(alert, camera);
            String subject = "[SmartGuard] " + alert.getPriority() + " · " + alert.getPublicId();

            if (appSettingsService.telegramEnabled()) {
                telegramNotifyService.send(body);
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
}
