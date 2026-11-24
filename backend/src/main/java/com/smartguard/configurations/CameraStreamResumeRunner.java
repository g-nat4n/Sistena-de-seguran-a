package com.smartguard.configurations;

import com.smartguard.entities.Camera;
import com.smartguard.entities.enums.StreamState;
import com.smartguard.repositories.CameraRepository;
import com.smartguard.services.CameraRtspService;
import com.smartguard.services.vision.VisionServiceClient;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Após reinício do app, retoma streams das câmeras que já tinham RTSP
 * e estavam ativas (CONNECTED / RECONNECTING / CONNECTING).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CameraStreamResumeRunner implements ApplicationRunner {

    private final CameraRepository cameraRepository;
    private final CameraRtspService cameraRtspService;
    private final VisionServiceClient visionServiceClient;

    @Override
    public void run(ApplicationArguments args) {
        Executors.newSingleThreadExecutor(r -> {
            Thread t = new Thread(r, "camera-stream-resume");
            t.setDaemon(true);
            return t;
        }).execute(this::resumeWhenVisionReady);
    }

    private void resumeWhenVisionReady() {
        boolean visionUp = false;
        for (int i = 0; i < 40; i++) {
            if (visionServiceClient.isReachable()) {
                visionUp = true;
                break;
            }
            sleep(1500);
        }
        if (!visionUp) {
            log.warn("Vision (8090) indisponível — retomada automática de câmeras adiada.");
            return;
        }

        List<Camera> cameras = cameraRepository.findAllByOrderByNameAsc();
        int resumed = 0;
        for (Camera camera : cameras) {
            if (!camera.hasRtspCredentials()) {
                continue;
            }
            StreamState state = camera.getStreamState();
            boolean shouldResume = state == StreamState.CONNECTED
                    || state == StreamState.RECONNECTING
                    || state == StreamState.CONNECTING
                    || state == StreamState.ERROR;
            if (!shouldResume) {
                continue;
            }
            try {
                var result = cameraRtspService.startStream(camera.getId());
                if (result.success()) {
                    resumed++;
                    log.info("Stream retomado camera_id={} identifier={}", camera.getId(), camera.getIdentifier());
                } else {
                    log.warn(
                            "Falha ao retomar camera_id={}: {}",
                            camera.getId(),
                            result.message()
                    );
                }
            } catch (Exception ex) {
                log.warn("Erro ao retomar camera_id={}: {}", camera.getId(), ex.getMessage());
            }
            sleep(800);
        }
        log.info("Retomada automática concluída: {} câmera(s)", resumed);
    }

    private static void sleep(long ms) {
        try {
            TimeUnit.MILLISECONDS.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }
}
