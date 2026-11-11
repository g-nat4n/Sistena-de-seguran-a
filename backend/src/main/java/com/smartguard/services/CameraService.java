package com.smartguard.services;

import com.smartguard.dto.camera.CameraRequest;
import com.smartguard.dto.camera.CameraResponse;
import com.smartguard.entities.Camera;
import com.smartguard.entities.Store;
import com.smartguard.exceptions.BusinessException;
import com.smartguard.exceptions.ResourceNotFoundException;
import com.smartguard.repositories.CameraRepository;
import com.smartguard.repositories.StoreRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CameraService {

    private final CameraRepository cameraRepository;
    private final StoreRepository storeRepository;

    @Transactional(readOnly = true)
    public List<CameraResponse> listAll() {
        return cameraRepository.findAllByOrderByNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CameraResponse getById(Long id) {
        return toResponse(findCamera(id));
    }

    @Transactional
    public CameraResponse create(CameraRequest request) {
        cameraRepository.findByIdentifier(request.identifier().trim()).ifPresent(existing -> {
            throw new BusinessException("Já existe câmera com identificação: " + request.identifier());
        });

        Store store = storeRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new BusinessException("Nenhuma loja cadastrada para vincular a câmera."));

        Camera camera = Camera.builder()
                .name(request.name().trim())
                .identifier(request.identifier().trim())
                .location(request.location().trim())
                .type(request.type())
                .description(normalize(request.description()))
                .status(request.status())
                .demoMediaUrl(normalize(request.demoMediaUrl()))
                .store(store)
                .build();

        return toResponse(cameraRepository.save(camera));
    }

    @Transactional
    public CameraResponse update(Long id, CameraRequest request) {
        Camera camera = findCamera(id);

        cameraRepository.findByIdentifier(request.identifier().trim()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new BusinessException("Já existe câmera com identificação: " + request.identifier());
            }
        });

        camera.setName(request.name().trim());
        camera.setIdentifier(request.identifier().trim());
        camera.setLocation(request.location().trim());
        camera.setType(request.type());
        camera.setDescription(normalize(request.description()));
        camera.setStatus(request.status());
        camera.setDemoMediaUrl(normalize(request.demoMediaUrl()));

        return toResponse(camera);
    }

    @Transactional
    public void delete(Long id) {
        Camera camera = findCamera(id);
        try {
            cameraRepository.delete(camera);
            cameraRepository.flush();
        } catch (Exception ex) {
            throw new BusinessException(
                    "Não é possível excluir a câmera enquanto existirem alertas vinculados. Desative-a (OFFLINE/MAINTENANCE)."
            );
        }
    }

    private Camera findCamera(Long id) {
        return cameraRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Câmera não encontrada: " + id));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
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
