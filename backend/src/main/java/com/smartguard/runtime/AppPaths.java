package com.smartguard.runtime;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AppPaths {

    private final Path dataDir;
    private final Path evidenceDir;
    private final Path backupDir;
    private final Path logsDir;
    private final Path dbFile;

    public AppPaths(
            @Value("${smartguard.data-dir:}") String configuredDataDir,
            @Value("${smartguard.evidence.dir:}") String configuredEvidenceDir,
            @Value("${smartguard.backup.dir:}") String configuredBackupDir,
            @Value("${smartguard.db.filename:seguranca_inteligente.db}") String dbFilename
    ) {
        this.dataDir = resolveDataDir(configuredDataDir);
        this.evidenceDir = firstNonBlank(configuredEvidenceDir, dataDir.resolve("evidence").toString());
        this.backupDir = firstNonBlank(configuredBackupDir, dataDir.resolve("backups").toString());
        this.logsDir = dataDir.resolve("logs");
        this.dbFile = dataDir.resolve(dbFilename);
        ensureDirs();
    }

    private static Path resolveDataDir(String configured) {
        if (configured != null && !configured.isBlank()) {
            return Paths.get(configured).toAbsolutePath().normalize();
        }
        String programData = System.getenv("ProgramData");
        if (programData != null && !programData.isBlank()) {
            return Paths.get(programData, "SmartGuard", "data").toAbsolutePath().normalize();
        }
        String home = System.getProperty("user.home", ".");
        return Paths.get(home, ".smartguard", "data").toAbsolutePath().normalize();
    }

    private static Path firstNonBlank(String value, String fallback) {
        if (value != null && !value.isBlank()) {
            return Paths.get(value).toAbsolutePath().normalize();
        }
        return Paths.get(fallback).toAbsolutePath().normalize();
    }

    private void ensureDirs() {
        try {
            Files.createDirectories(dataDir);
            Files.createDirectories(evidenceDir);
            Files.createDirectories(backupDir);
            Files.createDirectories(logsDir);
        } catch (Exception ex) {
            throw new IllegalStateException("Não foi possível criar diretórios do SmartGuard em " + dataDir, ex);
        }
    }

    public Path dataDir() {
        return dataDir;
    }

    public Path evidenceDir() {
        return evidenceDir;
    }

    public Path backupDir() {
        return backupDir;
    }

    public Path logsDir() {
        return logsDir;
    }

    public Path dbFile() {
        return dbFile;
    }
}
