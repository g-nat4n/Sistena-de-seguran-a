package com.smartguard.controllers;

import com.smartguard.dto.camera.CameraRequest;
import com.smartguard.dto.camera.CameraResponse;
import com.smartguard.dto.camera.CameraRtspConfigRequest;
import com.smartguard.dto.camera.StreamActionResponse;
import com.smartguard.services.CameraRtspService;
import com.smartguard.services.CameraService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cameras")
@RequiredArgsConstructor
public class CameraController {

    private final CameraService cameraService;
    private final CameraRtspService cameraRtspService;

    @GetMapping
    public List<CameraResponse> list() {
        return cameraService.listAll();
    }

    @GetMapping("/{id}")
    public CameraResponse get(@PathVariable Long id) {
        return cameraService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public CameraResponse create(@Valid @RequestBody CameraRequest request) {
        return cameraService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public CameraResponse update(@PathVariable Long id, @Valid @RequestBody CameraRequest request) {
        return cameraService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public void delete(@PathVariable Long id) {
        cameraService.delete(id);
    }

    @PutMapping("/{id}/rtsp")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public CameraResponse configureRtsp(
            @PathVariable Long id,
            @Valid @RequestBody CameraRtspConfigRequest request
    ) {
        return cameraRtspService.configureRtsp(id, request);
    }

    @PostMapping("/{id}/rtsp/test")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public StreamActionResponse testRtsp(@PathVariable Long id) {
        return cameraRtspService.testConnection(id);
    }

    @PostMapping("/{id}/stream/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public StreamActionResponse startStream(@PathVariable Long id) {
        return cameraRtspService.startStream(id);
    }

    @PostMapping("/{id}/stream/stop")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public StreamActionResponse stopStream(@PathVariable Long id) {
        return cameraRtspService.stopStream(id);
    }

    @GetMapping("/{id}/stream/status")
    public CameraResponse streamStatus(@PathVariable Long id) {
        return cameraService.getById(id);
    }
}
