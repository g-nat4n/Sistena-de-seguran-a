package com.smartguard.services;

import com.smartguard.dto.camera.CameraResponse;
import com.smartguard.dto.camera.CameraRtspConfigRequest;
import com.smartguard.dto.camera.StreamActionResponse;
import com.smartguard.dto.camera.StreamHeartbeatRequest;
import com.smartguard.entities.Camera;
import com.smartguard.entities.enums.CameraStatus;
import com.smartguard.entities.enums.StreamState;
import com.smartguard.exceptions.BusinessException;
import com.smartguard.exceptions.ResourceNotFoundException;
import com.smartguard.repositories.CameraRepository;
import com.smartguard.security.SecretEncryptionService;
import com.smartguard.services.vision.VisionServiceClient;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CameraRtspService {

    private final CameraRepository cameraRepository;
    private final SecretEncryptionService secretEncryptionService;
    private final VisionServiceClient visionServiceClient;
    private final CameraService cameraService;

    @Transactional
    public CameraResponse configureRtsp(Long cameraId, CameraRtspConfigRequest request) {
        Camera camera = findCamera(cameraId);

        String host = request.host().trim();
        int port = request.port() == null ? 554 : request.port();
        String path = normalizePath(request.path());
        String username = request.username().trim();

        if (host.isBlank()) {
            throw new BusinessException("Informe o IP da câmera/DVR (ex.: 192.168.1.50).");
        }
        if (looksLikeSerialNotHost(host)) {
            throw new BusinessException(
                    "O campo Host deve ser o IP da câmera na rede (ex.: 192.168.1.50), "
                            + "não o número de série/código RSV. Veja o IP no app ou no roteador."
            );
        }
        if (port < 1 || port > 65535) {
            throw new BusinessException("Porta RTSP inválida. Na maioria das Intelbras use 554.");
        }

        camera.setRtspHost(host);
        camera.setRtspPort(port);
        camera.setRtspPath(path);
        camera.setRtspUsername(username);
        camera.setRtspUrl(buildPublicRtspReference(host, port, path));

        if (request.password() != null && !request.password().isBlank()) {
            camera.setRtspPasswordEnc(secretEncryptionService.encrypt(request.password().trim()));
        } else if (!camera.hasRtspCredentials()) {
            throw new BusinessException("Informe a senha RTSP no primeiro cadastro.");
        }

        camera.setLastError(null);
        if (camera.getStreamState() == null) {
            camera.setStreamState(StreamState.IDLE);
        }

        log.info("RTSP configurado para câmera id={} host={} path={}", cameraId, host, path);
        return cameraService.getById(cameraId);
    }

    public StreamActionResponse testConnection(Long cameraId) {
        Camera camera = requireConfigured(cameraId);
        if (!visionServiceClient.isReachable()) {
            camera.setStreamState(StreamState.ERROR);
            camera.setLastError("Serviço de visão (porta 8090) offline. Reabra o SmartGuard.");
            cameraRepository.saveAndFlush(camera);
            return new StreamActionResponse(
                    cameraId,
                    StreamState.ERROR.name(),
                    false,
                    camera.getLastError()
            );
        }
        camera.setStreamState(StreamState.CONNECTING);
        camera.setLastTestedAt(Instant.now());
        cameraRepository.saveAndFlush(camera);

        String rtspUrl = buildAuthenticatedRtspUrl(camera);
        var result = visionServiceClient.testRtsp(cameraId, camera.getIdentifier(), rtspUrl);

        camera.setLastTestedAt(Instant.now());
        if (result.success()) {
            camera.setStreamState(StreamState.IDLE);
            camera.setLastError(null);
            camera.setStatus(CameraStatus.ONLINE);
            cameraRepository.saveAndFlush(camera);
            return new StreamActionResponse(cameraId, camera.getStreamState().name(), true, result.message());
        }

        camera.setStreamState(StreamState.ERROR);
        camera.setLastError(truncate(result.message()));
        cameraRepository.saveAndFlush(camera);
        return new StreamActionResponse(cameraId, camera.getStreamState().name(), false, result.message());
    }

    public StreamActionResponse startStream(Long cameraId) {
        Camera camera = requireConfigured(cameraId);
        if (!visionServiceClient.isReachable()) {
            camera.setStreamState(StreamState.ERROR);
            camera.setLastError("Serviço de visão (porta 8090) offline. Reabra o SmartGuard.");
            cameraRepository.saveAndFlush(camera);
            return new StreamActionResponse(
                    cameraId,
                    StreamState.ERROR.name(),
                    false,
                    camera.getLastError()
            );
        }
        camera.setStreamState(StreamState.CONNECTING);
        camera.setLastError(null);
        cameraRepository.saveAndFlush(camera);

        String rtspUrl = buildAuthenticatedRtspUrl(camera);
        var result = visionServiceClient.startStream(cameraId, camera.getIdentifier(), rtspUrl);

        if (result.success()) {
            camera.setStreamState(StreamState.CONNECTED);
            camera.setLastSeenAt(Instant.now());
            camera.setStatus(CameraStatus.ONLINE);
            cameraRepository.saveAndFlush(camera);
            return new StreamActionResponse(cameraId, camera.getStreamState().name(), true, result.message());
        }

        camera.setStreamState(StreamState.ERROR);
        camera.setLastError(truncate(result.message()));
        cameraRepository.saveAndFlush(camera);
        return new StreamActionResponse(cameraId, camera.getStreamState().name(), false, result.message());
    }

    @Transactional
    public StreamActionResponse stopStream(Long cameraId) {
        Camera camera = findCamera(cameraId);
        var result = visionServiceClient.stopStream(cameraId);
        camera.setStreamState(StreamState.STOPPED);
        if (!result.success()) {
            camera.setLastError(truncate(result.message()));
        } else {
            camera.setLastError(null);
        }
        return new StreamActionResponse(
                cameraId,
                camera.getStreamState().name(),
                result.success(),
                result.success() ? "Stream interrompido" : result.message()
        );
    }

    @Transactional
    public void heartbeat(Long cameraId, StreamHeartbeatRequest request) {
        Camera camera = findCamera(cameraId);
        camera.setStreamState(request.streamState());
        camera.setLastSeenAt(Instant.now());
        if (request.streamState() == StreamState.CONNECTED) {
            camera.setStatus(CameraStatus.ONLINE);
            camera.setLastError(null);
        } else if (request.streamState() == StreamState.ERROR || request.streamState() == StreamState.RECONNECTING) {
            camera.setLastError(truncate(request.lastError()));
        }
    }

    /**
     * Uso interno do worker Python. Não expor em controllers públicos sem proteção.
     */
    @Transactional(readOnly = true)
    public String resolveAuthenticatedRtspUrl(Long cameraId) {
        return buildAuthenticatedRtspUrl(requireConfigured(cameraId));
    }

    private Camera requireConfigured(Long cameraId) {
        Camera camera = findCamera(cameraId);
        if (!camera.hasRtspCredentials()) {
            throw new BusinessException("Câmera sem credenciais RTSP configuradas.");
        }
        return camera;
    }

    private Camera findCamera(Long cameraId) {
        return cameraRepository.findById(cameraId)
                .orElseThrow(() -> new ResourceNotFoundException("Câmera não encontrada: " + cameraId));
    }

    private String buildPublicRtspReference(String host, int port, String path) {
        return "rtsp://" + host + ":" + port + path;
    }

    private String buildAuthenticatedRtspUrl(Camera camera) {
        String password = secretEncryptionService.decrypt(camera.getRtspPasswordEnc());
        String user = urlEncode(camera.getRtspUsername());
        String pass = urlEncode(password);
        int port = camera.getRtspPort() == null ? 554 : camera.getRtspPort();
        return "rtsp://" + user + ":" + pass + "@" + camera.getRtspHost() + ":" + port + camera.getRtspPath();
    }

    private String normalizePath(String path) {
        String trimmed = path.trim();
        return trimmed.startsWith("/") ? trimmed : "/" + trimmed;
    }

    private boolean looksLikeSerialNotHost(String host) {
        String value = host.trim();
        if (value.matches("(?i)^RSV\\d+$")) {
            return true;
        }
        // Serial/código sem ponto e sem hífen de hostname típico
        return !value.contains(".") && !value.contains(":") && value.matches("(?i)^[A-Z]{2,}\\d{6,}$");
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private String truncate(String value) {
        if (value == null) {
            return null;
        }
        String safe = value.replaceAll("rtsp://[^\\s]+", "rtsp://***");
        return safe.length() <= 500 ? safe : safe.substring(0, 500);
    }
}
