package com.smartguard.runtime;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermission;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.EnumSet;
import java.util.HexFormat;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Guarda a chave SQLCipher no Credential Manager do Windows (quando disponível)
 * ou em arquivo restrito no data dir (dev/outros SO).
 */
@Component
public class DatabaseKeyStore {

    private static final Logger log = LoggerFactory.getLogger(DatabaseKeyStore.class);
    private static final String CREDENTIAL_TARGET = "SmartGuard/SQLCipher";

    private final AppPaths appPaths;

    public DatabaseKeyStore(AppPaths appPaths) {
        this.appPaths = appPaths;
    }

    public synchronized String getOrCreateKey() {
        String existing = readKey();
        if (existing != null && !existing.isBlank()) {
            return existing;
        }
        String generated = generateKey();
        persistKey(generated);
        return generated;
    }

    private String readKey() {
        if (isWindows()) {
            try {
                String fromCred = WinCredentialManager.read(CREDENTIAL_TARGET);
                if (fromCred != null && !fromCred.isBlank()) {
                    return fromCred;
                }
            } catch (Throwable ex) {
                log.warn("Credential Manager indisponível, usando arquivo local: {}", ex.toString());
            }
        }
        return readKeyFile();
    }

    private void persistKey(String key) {
        if (isWindows()) {
            try {
                WinCredentialManager.write(CREDENTIAL_TARGET, key);
                return;
            } catch (Throwable ex) {
                log.warn("Falha ao gravar no Credential Manager, usando arquivo local: {}", ex.toString());
            }
        }
        writeKeyFile(key);
    }

    private String readKeyFile() {
        Path file = keyFile();
        try {
            if (!Files.exists(file)) {
                return null;
            }
            return Files.readString(file, StandardCharsets.UTF_8).trim();
        } catch (Exception ex) {
            throw new IllegalStateException("Não foi possível ler a chave do banco", ex);
        }
    }

    private void writeKeyFile(String key) {
        Path file = keyFile();
        try {
            Files.writeString(file, key, StandardCharsets.UTF_8);
            try {
                Set<PosixFilePermission> perms = EnumSet.of(
                        PosixFilePermission.OWNER_READ,
                        PosixFilePermission.OWNER_WRITE
                );
                Files.setPosixFilePermissions(file, perms);
            } catch (UnsupportedOperationException ignored) {
                // Windows FS
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Não foi possível persistir a chave do banco", ex);
        }
    }

    private Path keyFile() {
        return appPaths.dataDir().resolve(".dbkey");
    }

    private static String generateKey() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private static boolean isWindows() {
        String os = System.getProperty("os.name", "").toLowerCase();
        return os.contains("win");
    }

    /** Helpers para testes — decodifica se necessário. */
    public static String toDisplaySafe(String key) {
        return Base64.getEncoder().encodeToString(key.getBytes(StandardCharsets.UTF_8)).substring(0, 8) + "…";
    }
}
