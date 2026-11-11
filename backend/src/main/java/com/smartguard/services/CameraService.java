package com.smartguard.services;

import com.smartguard.dto.camera.CameraResponse;
import com.smartguard.entities.Camera;
import com.smartguard.exceptions.ResourceNotFoundException;
import com.smartguard.repositories.CameraRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CameraService {

    private final CameraRepository cameraRepository;

    @Transactional(readOnly = true)
    public List<CameraResponse> listAll() {
        return cameraRepository.findAllByOrderByNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CameraResponse getById(Long id) {
        Camera camera = cameraRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Câmera não encontrada: " + id));
        return toResponse(camera);
    }

    private CameraResponse toResponse(Camera camera) {
        return new CameraResponse(
                camera.getId(),
                camera.getName(),
                camera.getIdentifier(),
                camera.getLocation(),
                camera.getType().name(),
                camera.getDescription(),
                camera.getStatus().name(),
                camera.getDemoMediaUrl(),
                camera.getRtspUrl() != null && !camera.getRtspUrl().isBlank(),
                camera.getUpdatedAt()
        );
    }
}
