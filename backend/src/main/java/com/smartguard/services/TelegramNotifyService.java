package com.smartguard.services;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramNotifyService {

    private final AppSettingsService appSettingsService;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    public List<String> send(String text) {
        List<String> results = new ArrayList<>();
        if (!appSettingsService.telegramEnabled()) {
            results.add("Telegram desligado nas configurações");
            return results;
        }
        String token = appSettingsService.telegramBotToken();
        List<String> chats = appSettingsService.telegramChatIds();
        if (token.isBlank()) {
            results.add("Token do bot Telegram não configurado");
            return results;
        }
        if (chats.isEmpty()) {
            results.add("Nenhum Chat ID configurado");
            return results;
        }

        for (String chatId : chats) {
            try {
                String body = "chat_id=" + URLEncoder.encode(chatId, StandardCharsets.UTF_8)
                        + "&text=" + URLEncoder.encode(text, StandardCharsets.UTF_8)
                        + "&disable_web_page_preview=true";
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.telegram.org/bot" + token + "/sendMessage"))
                        .timeout(Duration.ofSeconds(12))
                        .header("Content-Type", "application/x-www-form-urlencoded")
                        .POST(HttpRequest.BodyPublishers.ofString(body))
                        .build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    results.add("Telegram OK → " + chatId);
                } else {
                    log.warn("Telegram falhou chat={} status={} body={}", chatId, response.statusCode(), response.body());
                    results.add("Telegram falhou (" + chatId + "): HTTP " + response.statusCode());
                }
            } catch (Exception ex) {
                log.warn("Telegram erro chat={}: {}", chatId, ex.toString());
                results.add("Telegram erro (" + chatId + "): " + ex.getMessage());
            }
        }
        return results;
    }
}
