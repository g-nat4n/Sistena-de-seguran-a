package com.smartguard.services.vision;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class VisionServiceClient {

    private final RestClient restClient;
    private final String serviceToken;

    public VisionServiceClient(
            @Value("${smartguard.vision.base-url}") String baseUrl,
            @Value("${smartguard.vision.service-token}") String serviceToken
    ) {
        this.serviceToken = serviceToken;
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public VisionOperationResult testRtsp(Long cameraId, String rtspUrl) {
        return post("/streams/test", Map.of(
                "cameraId", cameraId,
                "rtspUrl", rtspUrl
        ));
    }

    public VisionOperationResult startStream(Long cameraId, String rtspUrl) {
        return post("/streams/start", Map.of(
                "cameraId", cameraId,
                "rtspUrl", rtspUrl
        ));
    }

    public VisionOperationResult stopStream(Long cameraId) {
        return post("/streams/stop", Map.of(
                "cameraId", cameraId
        ));
    }

    private VisionOperationResult post(String path, Map<String, Object> body) {
        try {
            VisionOperationResult result = restClient.post()
                    .uri(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Service-Token", serviceToken)
                    .body(body)
                    .retrieve()
                    .body(VisionOperationResult.class);
            if (result == null) {
                return new VisionOperationResult(false, "Resposta vazia do serviço de visão");
            }
            return result;
        } catch (RestClientException ex) {
            return new VisionOperationResult(
                    false,
                    "Serviço de visão indisponível: " + safeMessage(ex.getMessage())
            );
        }
    }

    private String safeMessage(String message) {
        if (message == null) {
            return "erro desconhecido";
        }
        // Evita vazar URL completa com credenciais em mensagens de erro.
        return message.replaceAll("rtsp://[^\\s]+", "rtsp://***");
    }

    public record VisionOperationResult(boolean success, String message) {
    }
}
