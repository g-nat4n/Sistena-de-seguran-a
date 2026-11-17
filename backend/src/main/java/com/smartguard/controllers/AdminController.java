package com.smartguard.controllers;

import com.smartguard.runtime.AppPaths;
import com.smartguard.runtime.ServerRuntimeInfo;
import com.smartguard.services.AuditService;
import com.smartguard.services.BackupService;
import com.smartguard.services.ServerStatusService;
import com.smartguard.services.WindowsServiceControl;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.file.Path;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ServerStatusService serverStatusService;
    private final BackupService backupService;
    private final AuditService auditService;
    private final WindowsServiceControl windowsServiceControl;
    private final AppPaths appPaths;
    private final ServerRuntimeInfo runtimeInfo;

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public Map<String, Object> status() {
        return serverStatusService.adminStatus();
    }

    @GetMapping("/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public Object logs(@RequestParam(defaultValue = "50") int limit) {
        return auditService.recent(limit);
    }

    @PostMapping("/backup")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> backup(@AuthenticationPrincipal UserDetails principal, HttpServletRequest http) {
        Map<String, Object> result = backupService.createBackup(principal.getUsername());
        auditService.record("BACKUP_CREATED", principal.getUsername(), String.valueOf(result.get("filename")), http.getRemoteAddr());
        return result;
    }

    @GetMapping("/backup/download")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> download(@RequestParam String filename) {
        Path file = appPaths.backupDir().resolve(filename).normalize();
        if (!file.startsWith(appPaths.backupDir()) || !file.toFile().exists()) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @PostMapping(value = "/restore", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> restore(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest http
    ) throws Exception {
        Path temp = appPaths.backupDir().resolve("upload-" + System.currentTimeMillis() + ".zip");
        file.transferTo(temp);
        Map<String, Object> result = backupService.restoreBackup(temp);
        auditService.record("BACKUP_RESTORED", principal.getUsername(), file.getOriginalFilename(), http.getRemoteAddr());
        return result;
    }

    @PostMapping("/service/{action}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> serviceAction(
            @PathVariable String action,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest http
    ) {
        Map<String, Object> result = windowsServiceControl.control(action);
        auditService.record("SERVICE_" + action.toUpperCase(), principal.getUsername(), String.valueOf(result), http.getRemoteAddr());
        return result;
    }

    @PostMapping("/heartbeat")
    @PreAuthorize("isAuthenticated()")
    public Map<String, String> heartbeat(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String clientId = body != null && body.get("clientId") != null
                ? body.get("clientId")
                : principal.getUsername();
        runtimeInfo.touchClient(clientId);
        return Map.of("status", "OK");
    }
}
