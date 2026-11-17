package com.smartguard.services;

import com.smartguard.exceptions.BusinessException;
import com.smartguard.runtime.AppPaths;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.Map;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;
import javax.sql.DataSource;
import org.springframework.stereotype.Service;

@Service
public class BackupService {

    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").withZone(ZoneOffset.UTC);

    private final AppPaths appPaths;
    private final DataSource dataSource;
    private final EvidenceStorageService evidenceStorageService;

    public BackupService(AppPaths appPaths, DataSource dataSource, EvidenceStorageService evidenceStorageService) {
        this.appPaths = appPaths;
        this.dataSource = dataSource;
        this.evidenceStorageService = evidenceStorageService;
    }

    public Map<String, Object> createBackup(String actorEmail) {
        checkpointWal();
        String name = "smartguard-backup-" + TS.format(Instant.now()) + ".zip";
        Path target = appPaths.backupDir().resolve(name);
        try {
            Files.createDirectories(appPaths.backupDir());
            try (OutputStream fos = Files.newOutputStream(target);
                 ZipOutputStream zip = new ZipOutputStream(fos)) {
                addFile(zip, "database/" + appPaths.dbFile().getFileName(), appPaths.dbFile());
                Path wal = Path.of(appPaths.dbFile().toString() + "-wal");
                Path shm = Path.of(appPaths.dbFile().toString() + "-shm");
                if (Files.exists(wal)) {
                    addFile(zip, "database/" + wal.getFileName(), wal);
                }
                if (Files.exists(shm)) {
                    addFile(zip, "database/" + shm.getFileName(), shm);
                }
                Path evidenceRoot = evidenceStorageService.root();
                if (Files.isDirectory(evidenceRoot)) {
                    try (Stream<Path> walk = Files.walk(evidenceRoot)) {
                        walk.filter(Files::isRegularFile).forEach(file -> {
                            try {
                                String entry = "evidence/" + evidenceRoot.relativize(file).toString().replace('\\', '/');
                                addFile(zip, entry, file);
                            } catch (IOException ex) {
                                throw new BusinessException("Falha ao incluir evidência no backup: " + ex.getMessage());
                            }
                        });
                    }
                }
            }
            return Map.of(
                    "filename", name,
                    "path", target.toAbsolutePath().toString(),
                    "sizeBytes", Files.size(target),
                    "createdBy", actorEmail == null ? "" : actorEmail
            );
        } catch (IOException ex) {
            throw new BusinessException("Falha ao criar backup: " + ex.getMessage());
        }
    }

    public Map<String, Object> restoreBackup(Path zipPath) {
        if (zipPath == null || !Files.exists(zipPath)) {
            throw new BusinessException("Arquivo de backup não encontrado.");
        }
        Path staging = appPaths.dataDir().resolve("restore-staging-" + System.currentTimeMillis());
        try {
            Files.createDirectories(staging);
            unzip(zipPath, staging);
            Path dbInZip = staging.resolve("database").resolve(appPaths.dbFile().getFileName().toString());
            if (!Files.exists(dbInZip)) {
                try (Stream<Path> files = Files.list(staging.resolve("database"))) {
                    dbInZip = files.filter(p -> p.getFileName().toString().endsWith(".db")).findFirst()
                            .orElseThrow(() -> new BusinessException("Backup sem arquivo de banco."));
                }
            }
            checkpointWal();
            Files.copy(dbInZip, appPaths.dbFile(), StandardCopyOption.REPLACE_EXISTING);
            Path evidenceStaging = staging.resolve("evidence");
            if (Files.isDirectory(evidenceStaging)) {
                Path evidenceRoot = evidenceStorageService.root();
                Files.createDirectories(evidenceRoot);
                try (Stream<Path> walk = Files.walk(evidenceStaging)) {
                    walk.filter(Files::isRegularFile).forEach(file -> {
                        try {
                            Path dest = evidenceRoot.resolve(evidenceStaging.relativize(file).toString());
                            Files.createDirectories(dest.getParent());
                            Files.copy(file, dest, StandardCopyOption.REPLACE_EXISTING);
                        } catch (IOException ex) {
                            throw new BusinessException("Falha ao restaurar evidência: " + ex.getMessage());
                        }
                    });
                }
            }
            return Map.of(
                    "status", "RESTORED",
                    "database", appPaths.dbFile().toAbsolutePath().toString(),
                    "note", "Reinicie o serviço SmartGuardApi para aplicar o banco restaurado."
            );
        } catch (IOException ex) {
            throw new BusinessException("Falha ao restaurar backup: " + ex.getMessage());
        } finally {
            deleteRecursive(staging);
        }
    }

    private void checkpointWal() {
        try (var conn = dataSource.getConnection(); var st = conn.createStatement()) {
            st.execute("PRAGMA wal_checkpoint(FULL)");
        } catch (Exception ignored) {
            // Postgres profile: ignore
        }
    }

    private static void addFile(ZipOutputStream zip, String entryName, Path file) throws IOException {
        if (!Files.exists(file)) {
            return;
        }
        ZipEntry entry = new ZipEntry(entryName);
        zip.putNextEntry(entry);
        Files.copy(file, zip);
        zip.closeEntry();
    }

    private static void unzip(Path zipPath, Path targetDir) throws IOException {
        try (ZipInputStream zis = new ZipInputStream(Files.newInputStream(zipPath))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                Path out = targetDir.resolve(entry.getName()).normalize();
                if (!out.startsWith(targetDir)) {
                    throw new BusinessException("Entrada de backup inválida.");
                }
                if (entry.isDirectory()) {
                    Files.createDirectories(out);
                } else {
                    Files.createDirectories(out.getParent());
                    Files.copy(zis, out, StandardCopyOption.REPLACE_EXISTING);
                }
                zis.closeEntry();
            }
        }
    }

    private static void deleteRecursive(Path root) {
        if (root == null || !Files.exists(root)) {
            return;
        }
        try (Stream<Path> walk = Files.walk(root)) {
            walk.sorted(Comparator.reverseOrder()).forEach(p -> {
                try {
                    Files.deleteIfExists(p);
                } catch (IOException ignored) {
                }
            });
        } catch (IOException ignored) {
        }
    }
}
