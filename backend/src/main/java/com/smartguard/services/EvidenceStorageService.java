package com.smartguard.services;

import com.smartguard.exceptions.BusinessException;
import com.smartguard.runtime.AppPaths;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Service
public class EvidenceStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/webm",
            "video/mp4"
    );

    private final Path root;

    public EvidenceStorageService(AppPaths appPaths) {
        this.root = appPaths.evidenceDir();
        try {
            Files.createDirectories(this.root);
        } catch (IOException ex) {
            throw new IllegalStateException("Não foi possível criar diretório de evidências: " + this.root, ex);
        }
    }

    public record StoredEvidence(String filename, String mediaType, String url, long sizeBytes) {
    }

    public Path root() {
        return root;
    }

    public StoredEvidence store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Arquivo de evidência vazio.");
        }

        String contentType = normalizeContentType(file.getContentType());
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BusinessException("Tipo de evidência não suportado: " + contentType);
        }

        String extension = extensionFor(contentType);
        String filename = "ev-" + UUID.randomUUID().toString().replace("-", "") + extension;
        Path target = root.resolve(filename).normalize();
        if (!target.startsWith(root)) {
            throw new BusinessException("Caminho de evidência inválido.");
        }

        try {
            file.transferTo(target);
        } catch (IOException ex) {
            throw new BusinessException("Falha ao gravar evidência: " + ex.getMessage());
        }

        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/evidence/files/")
                .path(filename)
                .toUriString();

        return new StoredEvidence(filename, contentType, url, file.getSize());
    }

    public Path resolve(String filename) {
        if (filename == null || filename.isBlank() || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new BusinessException("Nome de evidência inválido.");
        }
        Path target = root.resolve(filename).normalize();
        if (!target.startsWith(root) || !Files.exists(target)) {
            throw new BusinessException("Evidência não encontrada.");
        }
        return target;
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "application/octet-stream";
        }
        return contentType.split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
    }

    private String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "video/webm" -> ".webm";
            case "video/mp4" -> ".mp4";
            default -> ".jpg";
        };
    }
}
