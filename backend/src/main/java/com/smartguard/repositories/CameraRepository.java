package com.smartguard.repositories;

import com.smartguard.entities.Camera;
import com.smartguard.entities.enums.CameraStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CameraRepository extends JpaRepository<Camera, Long> {
    Optional<Camera> findByIdentifier(String identifier);
    long countByStatus(CameraStatus status);
    List<Camera> findAllByOrderByNameAsc();
}
