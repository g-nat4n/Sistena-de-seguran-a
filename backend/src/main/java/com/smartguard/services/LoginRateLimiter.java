package com.smartguard.services;

import com.smartguard.exceptions.BusinessException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class LoginRateLimiter {

    private final int maxAttempts;
    private final long lockSeconds;
    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    public LoginRateLimiter(
            @Value("${smartguard.security.login-max-attempts:5}") int maxAttempts,
            @Value("${smartguard.security.login-lock-seconds:60}") long lockSeconds
    ) {
        this.maxAttempts = maxAttempts;
        this.lockSeconds = lockSeconds;
    }

    public void checkAllowed(String key) {
        Attempt attempt = attempts.get(normalize(key));
        if (attempt == null) {
            return;
        }
        if (attempt.lockedUntil != null && Instant.now().isBefore(attempt.lockedUntil)) {
            throw new BusinessException("Muitas tentativas de login. Aguarde e tente novamente.");
        }
    }

    public void recordFailure(String key) {
        String k = normalize(key);
        Attempt attempt = attempts.computeIfAbsent(k, ignored -> new Attempt());
        attempt.count++;
        if (attempt.count >= maxAttempts) {
            attempt.lockedUntil = Instant.now().plusSeconds(lockSeconds);
            attempt.count = 0;
        }
    }

    public void recordSuccess(String key) {
        attempts.remove(normalize(key));
    }

    private static String normalize(String key) {
        return key == null ? "" : key.trim().toLowerCase();
    }

    private static final class Attempt {
        int count;
        Instant lockedUntil;
    }
}
