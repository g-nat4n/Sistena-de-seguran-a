package com.smartguard.runtime;

import java.lang.management.ManagementFactory;
import java.net.InetAddress;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ServerRuntimeInfo {

    private final Instant startedAt = Instant.now();
    private final ConcurrentHashMap<String, Long> recentClients = new ConcurrentHashMap<>();

    @Value("${server.port:8080}")
    private int port;

    @Value("${server.address:127.0.0.1}")
    private String bindAddress;

    @Value("${smartguard.network.mode:standalone}")
    private String networkMode;

    public Instant startedAt() {
        return startedAt;
    }

    public long uptimeSeconds() {
        return Math.max(0, Instant.now().getEpochSecond() - startedAt.getEpochSecond());
    }

    public int port() {
        return port;
    }

    public String bindAddress() {
        return bindAddress;
    }

    public String networkMode() {
        return networkMode;
    }

    public String localIp() {
        try {
            return InetAddress.getLocalHost().getHostAddress();
        } catch (Exception ex) {
            return "127.0.0.1";
        }
    }

    public void touchClient(String clientId) {
        if (clientId == null || clientId.isBlank()) {
            return;
        }
        recentClients.put(clientId, System.currentTimeMillis());
        long cutoff = System.currentTimeMillis() - 5 * 60_000L;
        recentClients.entrySet().removeIf(e -> e.getValue() < cutoff);
    }

    public int connectedClientsEstimate() {
        long cutoff = System.currentTimeMillis() - 5 * 60_000L;
        AtomicInteger count = new AtomicInteger();
        recentClients.forEach((k, v) -> {
            if (v >= cutoff) {
                count.incrementAndGet();
            }
        });
        return count.get();
    }

    public long jvmUptimeMs() {
        return ManagementFactory.getRuntimeMXBean().getUptime();
    }
}
