package com.smartguard.services;

import java.io.IOException;
import java.math.BigInteger;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramNotifyService {

    private static final long MAX_MEDIA_BYTES = 45L * 1024 * 1024;
    private static final int MAX_CAPTION = 1024;

    private final AppSettingsService appSettingsService;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    public List<String> send(String text) {
        List<String> results = new ArrayList<>();
        Credentials creds = credentials(results);
        if (creds == null) {
            return results;
        }

        for (String chatId : creds.chats()) {
            results.add(sendText(creds.token(), chatId, text));
        }
        return results;
    }

    /**
     * Envia mídia local (vídeo ou foto) com legenda para todos os Chat IDs.
     * Se o arquivo for inválido/grande ou a API falhar, faz fallback para texto.
     */
    public List<String> sendMedia(String caption, Path file, boolean video) {
        List<String> results = new ArrayList<>();
        Credentials creds = credentials(results);
        if (creds == null) {
            return results;
        }

        String safeCaption = truncateCaption(caption);
        if (file == null || !Files.isRegularFile(file)) {
            log.warn("Telegram mídia ausente, enviando só texto");
            return send(safeCaption);
        }

        long size;
        try {
            size = Files.size(file);
        } catch (IOException ex) {
            log.warn("Telegram não leu mídia {}: {}", file, ex.toString());
            return send(safeCaption);
        }
        if (size <= 0 || size > MAX_MEDIA_BYTES) {
            log.warn("Telegram mídia inválida size={} path={}", size, file);
            return send(safeCaption);
        }

        String method = video ? "sendVideo" : "sendPhoto";
        String field = video ? "video" : "photo";
        String filename = file.getFileName().toString();
        String contentType = contentTypeFor(filename, video);

        for (String chatId : creds.chats()) {
            try {
                String boundary = "----sg" + new BigInteger(128, ThreadLocalRandom.current()).toString(16);
                byte[] body = buildMultipart(boundary, chatId, safeCaption, field, filename, contentType, file);
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.telegram.org/bot" + creds.token() + "/" + method))
                        .timeout(Duration.ofSeconds(60))
                        .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                        .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                        .build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    results.add("Telegram mídia OK → " + chatId);
                } else {
                    log.warn(
                            "Telegram mídia falhou chat={} status={} body={}",
                            chatId,
                            response.statusCode(),
                            response.body()
                    );
                    results.add(sendText(creds.token(), chatId, safeCaption));
                }
            } catch (Exception ex) {
                log.warn("Telegram mídia erro chat={}: {}", chatId, ex.toString());
                results.add(sendText(creds.token(), chatId, safeCaption));
            }
        }
        return results;
    }

    private Credentials credentials(List<String> results) {
        if (!appSettingsService.telegramEnabled()) {
            results.add("Telegram desligado nas configurações");
            return null;
        }
        String token = appSettingsService.telegramBotToken();
        List<String> chats = appSettingsService.telegramChatIds();
        if (token.isBlank()) {
            results.add("Token do bot Telegram não configurado");
            return null;
        }
        if (chats.isEmpty()) {
            results.add("Nenhum Chat ID configurado");
            return null;
        }
        return new Credentials(token, chats);
    }

    private String sendText(String token, String chatId, String text) {
        try {
            String body = "chat_id=" + URLEncoder.encode(chatId, StandardCharsets.UTF_8)
                    + "&text=" + URLEncoder.encode(text == null ? "" : text, StandardCharsets.UTF_8)
                    + "&disable_web_page_preview=true";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.telegram.org/bot" + token + "/sendMessage"))
                    .timeout(Duration.ofSeconds(12))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return "Telegram OK → " + chatId;
            }
            log.warn("Telegram falhou chat={} status={} body={}", chatId, response.statusCode(), response.body());
            return "Telegram falhou (" + chatId + "): HTTP " + response.statusCode();
        } catch (Exception ex) {
            log.warn("Telegram erro chat={}: {}", chatId, ex.toString());
            return "Telegram erro (" + chatId + "): " + ex.getMessage();
        }
    }

    private static byte[] buildMultipart(
            String boundary,
            String chatId,
            String caption,
            String fileField,
            String filename,
            String contentType,
            Path file
    ) throws IOException {
        String dash = "--" + boundary;
        String crlf = "\r\n";
        StringBuilder head = new StringBuilder();
        head.append(dash).append(crlf)
                .append("Content-Disposition: form-data; name=\"chat_id\"").append(crlf).append(crlf)
                .append(chatId).append(crlf);
        if (caption != null && !caption.isBlank()) {
            head.append(dash).append(crlf)
                    .append("Content-Disposition: form-data; name=\"caption\"").append(crlf).append(crlf)
                    .append(caption).append(crlf);
        }
        head.append(dash).append(crlf)
                .append("Content-Disposition: form-data; name=\"").append(fileField)
                .append("\"; filename=\"").append(filename).append("\"").append(crlf)
                .append("Content-Type: ").append(contentType).append(crlf).append(crlf);

        byte[] headBytes = head.toString().getBytes(StandardCharsets.UTF_8);
        byte[] fileBytes = Files.readAllBytes(file);
        byte[] tailBytes = (crlf + dash + "--" + crlf).getBytes(StandardCharsets.UTF_8);

        byte[] all = new byte[headBytes.length + fileBytes.length + tailBytes.length];
        System.arraycopy(headBytes, 0, all, 0, headBytes.length);
        System.arraycopy(fileBytes, 0, all, headBytes.length, fileBytes.length);
        System.arraycopy(tailBytes, 0, all, headBytes.length + fileBytes.length, tailBytes.length);
        return all;
    }

    private static String truncateCaption(String caption) {
        if (caption == null) {
            return "";
        }
        String trimmed = caption.trim();
        if (trimmed.length() <= MAX_CAPTION) {
            return trimmed;
        }
        return trimmed.substring(0, MAX_CAPTION - 1) + "…";
    }

    private static String contentTypeFor(String filename, boolean video) {
        String lower = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
        if (video) {
            if (lower.endsWith(".webm")) {
                return "video/webm";
            }
            return "video/mp4";
        }
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    private record Credentials(String token, List<String> chats) {
    }
}
