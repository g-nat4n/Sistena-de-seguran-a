package com.smartguard.services;

import com.smartguard.entities.enums.CameraStatus;
import com.smartguard.entities.enums.StreamState;
import com.smartguard.repositories.CameraRepository;
import com.smartguard.runtime.AppPaths;
import com.smartguard.runtime.ServerRuntimeInfo;
import com.smartguard.services.vision.VisionServiceClient;
import java.nio.file.Files;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.sql.DataSource;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ServerStatusService {

    private final DataSource dataSource;
    private final AppPaths appPaths;
    private final ServerRuntimeInfo runtimeInfo;
    private final CameraRepository cameraRepository;
    private final VisionServiceClient visionServiceClient;

    public Map<String, Object> health() {
        String db = databaseStatus();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "UP".equals(db) ? "UP" : "DEGRADED");
        body.put("service", "smartguard-api");
        body.put("mode", runtimeInfo.networkMode());
        body.put("database", db);
        body.put("databaseFile", appPaths.dbFile().toString());
        body.put("vision", visionStatus());
        return body;
    }

    public Map<String, Object> adminStatus() {
        Map<String, Object> body = new LinkedHashMap<>(health());
        long camerasTotal = cameraRepository.count();
        long camerasOnline = cameraRepository.findAll().stream()
                .filter(c -> c.getStatus() == CameraStatus.ONLINE)
                .count();
        long streamsActive = cameraRepository.findAll().stream()
                .filter(c -> c.getStreamState() == StreamState.CONNECTED
                        || c.getStreamState() == StreamState.CONNECTING
                        || c.getStreamState() == StreamState.RECONNECTING)
                .count();
        body.put("serverOnline", true);
        body.put("localIp", runtimeInfo.localIp());
        body.put("bindAddress", runtimeInfo.bindAddress());
        body.put("apiPort", runtimeInfo.port());
        body.put("startedAt", runtimeInfo.startedAt().toString());
        body.put("uptimeSeconds", runtimeInfo.uptimeSeconds());
        body.put("connectedClients", runtimeInfo.connectedClientsEstimate());
        body.put("camerasTotal", camerasTotal);
        body.put("camerasOnline", camerasOnline);
        body.put("streamsActive", streamsActive);
        body.put("evidenceDir", appPaths.evidenceDir().toString());
        body.put("backupDir", appPaths.backupDir().toString());
        body.put("dbExists", Files.exists(appPaths.dbFile()));
        return body;
    }

    private String databaseStatus() {
        try (var conn = dataSource.getConnection(); var st = conn.createStatement()) {
            st.execute("SELECT 1");
            return "UP";
        } catch (Exception ex) {
            return "DOWN";
        }
    }

    private String visionStatus() {
        try {
            return visionServiceClient.isReachable() ? "UP" : "DOWN";
        } catch (Exception ex) {
            return "DOWN";
        }
    }
}
