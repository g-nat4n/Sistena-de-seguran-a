package com.smartguard.services;

import com.smartguard.exceptions.BusinessException;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Service;

@Service
public class WindowsServiceControl {

    public static final String API_SERVICE = "SmartGuardApi";
    public static final String VISION_SERVICE = "SmartGuardVision";

    public Map<String, Object> control(String action) {
        String normalized = action == null ? "" : action.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "start" -> runSc("start", API_SERVICE);
            case "stop" -> runSc("stop", API_SERVICE);
            case "restart" -> {
                runSc("stop", API_SERVICE);
                yield runSc("start", API_SERVICE);
            }
            case "status" -> Map.of(
                    "api", query(API_SERVICE),
                    "vision", query(VISION_SERVICE)
            );
            default -> throw new BusinessException("Ação de serviço inválida: " + action);
        };
    }

    private Map<String, Object> runSc(String verb, String service) {
        if (!isWindows()) {
            return Map.of("ok", false, "message", "Controle de serviço disponível apenas no Windows");
        }
        try {
            Process process = new ProcessBuilder("sc", verb, service)
                    .redirectErrorStream(true)
                    .start();
            boolean finished = process.waitFor(20, TimeUnit.SECONDS);
            String output = read(process);
            if (!finished) {
                process.destroyForcibly();
                throw new BusinessException("Timeout ao executar sc " + verb);
            }
            return Map.of(
                    "ok", process.exitValue() == 0,
                    "service", service,
                    "action", verb,
                    "output", output
            );
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BusinessException("Falha ao controlar serviço: " + ex.getMessage());
        }
    }

    private String query(String service) {
        if (!isWindows()) {
            return "UNSUPPORTED";
        }
        try {
            Process process = new ProcessBuilder("sc", "query", service)
                    .redirectErrorStream(true)
                    .start();
            process.waitFor(10, TimeUnit.SECONDS);
            String out = read(process);
            if (out.contains("RUNNING")) {
                return "RUNNING";
            }
            if (out.contains("STOPPED")) {
                return "STOPPED";
            }
            return "UNKNOWN";
        } catch (Exception ex) {
            return "ERROR";
        }
    }

    private static String read(Process process) throws Exception {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append('\n');
            }
        }
        return sb.toString().trim();
    }

    private static boolean isWindows() {
        return System.getProperty("os.name", "").toLowerCase(Locale.ROOT).contains("win");
    }
}
