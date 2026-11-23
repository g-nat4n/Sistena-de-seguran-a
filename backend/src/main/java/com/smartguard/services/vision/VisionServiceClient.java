package com.smartguard.services.vision;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class VisionServiceClient {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String baseUrl;
    private final String serviceToken;

    public VisionServiceClient(
            @Value("${smartguard.vision.base-url}") String baseUrl,
            @Value("${smartguard.vision.service-token}") String serviceToken
    ) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.serviceToken = serviceToken;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    public VisionOperationResult testRtsp(Long cameraId, String cameraIdentifier, String rtspUrl) {
        return post("/streams/test", body(cameraId, cameraIdentifier, rtspUrl));
    }

    public VisionOperationResult startStream(Long cameraId, String cameraIdentifier, String rtspUrl) {
        return post("/streams/start", body(cameraId, cameraIdentifier, rtspUrl));
    }

    public VisionOperationResult stopStream(Long cameraId) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("cameraId", cameraId);
        return post("/streams/stop", payload);
    }

    private Map<String, Object> body(Long cameraId, String cameraIdentifier, String rtspUrl) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("cameraId", cameraId);
        payload.put("cameraIdentifier", cameraIdentifier == null ? "" : cameraIdentifier);
        payload.put("rtspUrl", rtspUrl);
        return payload;
    }

    private VisionOperationResult post(String path, Map<String, Object> body) {
        try {
            byte[] json = objectMapper.writeValueAsBytes(body);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + path))
                    .timeout(Duration.ofSeconds(45))
                    .header("Content-Type", "application/json")
                    .header("X-Service-Token", serviceToken)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(json))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            String responseBody = response.body() == null ? "" : response.body();

            if (status >= 200 && status < 300) {
                if (responseBody.isBlank()) {
                    return new VisionOperationResult(false, "Resposta vazia do serviço de visão");
                }
                JsonNode node = objectMapper.readTree(responseBody);
                boolean success = node.path("success").asBoolean(false);
                String message = node.path("message").asText("Sem mensagem do Vision");
                return new VisionOperationResult(success, message);
            }

            return new VisionOperationResult(false, formatHttpError(status, responseBody));
        } catch (Exception ex) {
            String detail = safeMessage(ex.getMessage());
            if (isConnectionProblem(detail)) {
                return new VisionOperationResult(
                        false,
                        "Serviço de visão (porta 8090) não está respondendo. "
                                + "Feche e abra o SmartGuard de novo. Detalhe: " + detail
                );
            }
            return new VisionOperationResult(false, "Falha ao falar com o Vision: " + detail);
        }
    }

    private String formatHttpError(int status, String responseBody) {
        if (status == 422) {
            return "Vision recebeu a chamada, mas rejeitou os dados (422). "
                    + "Confira IP/porta/path/usuário/senha e salve o RTSP de novo. "
                    + "Detalhe: " + truncate(safeMessage(responseBody));
        }
        if (status == 401 || status == 403) {
            return "Vision recusou autenticação do serviço. Reinstale o SmartGuard.";
        }
        return "Vision respondeu HTTP " + status + ": " + truncate(safeMessage(responseBody));
    }

    private boolean isConnectionProblem(String message) {
        String lower = message == null ? "" : message.toLowerCase();
        return lower.contains("connection refused")
                || lower.contains("connect timed out")
                || lower.contains("i/o error")
                || lower.contains("connection reset")
                || lower.contains("failed to connect");
    }

    private String safeMessage(String message) {
        if (message == null || message.isBlank()) {
            return "erro desconhecido";
        }
        return message.replaceAll("rtsp://[^\\s\"]+", "rtsp://***");
    }

    private String truncate(String value) {
        return value.length() <= 400 ? value : value.substring(0, 400) + "...";
    }

    public boolean isReachable() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/health"))
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception ex) {
            return false;
        }
    }

    public record VisionOperationResult(boolean success, String message) {
    }
}
