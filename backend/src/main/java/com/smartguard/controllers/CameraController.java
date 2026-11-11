package com.smartguard.controllers;

import com.smartguard.dto.camera.CameraResponse;
import com.smartguard.services.CameraService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
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
}
