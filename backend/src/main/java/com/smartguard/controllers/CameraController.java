package com.smartguard.controllers;

import com.smartguard.dto.camera.CameraRequest;
import com.smartguard.dto.camera.CameraResponse;
import com.smartguard.services.CameraService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    public CameraResponse create(@Valid @RequestBody CameraRequest request) {
        return cameraService.create(request);
    }

    @PutMapping("/{id}")
    public CameraResponse update(@PathVariable Long id, @Valid @RequestBody CameraRequest request) {
        return cameraService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        cameraService.delete(id);
    }
}
