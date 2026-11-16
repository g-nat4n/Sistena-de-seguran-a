package com.smartguard.services.vision;

import java.util.HashMap;
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

    public VisionOperationResult testRtsp(Long cameraId, String cameraIdentifier, String rtspUrl) {
        return post("/streams/test", body(cameraId, cameraIdentifier, rtspUrl));
    }

    public VisionOperationResult startStream(Long cameraId, String cameraIdentifier, String rtspUrl) {
        return post("/streams/start", body(cameraId, cameraIdentifier, rtspUrl));
    }

    public VisionOperationResult stopStream(Long cameraId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("cameraId", cameraId);
        return post("/streams/stop", payload);
    }

    private Map<String, Object> body(Long cameraId, String cameraIdentifier, String rtspUrl) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("cameraId", cameraId);
        payload.put("cameraIdentifier", cameraIdentifier);
        payload.put("rtspUrl", rtspUrl);
        return payload;
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
        return message.replaceAll("rtsp://[^\\s]+", "rtsp://***");
    }

    public record VisionOperationResult(boolean success, String message) {
    }
}
