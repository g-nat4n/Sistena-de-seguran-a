package com.smartguard.repositories;

import com.smartguard.entities.Alert;
import com.smartguard.entities.enums.AlertPriority;
import com.smartguard.entities.enums.AlertStatus;
import com.smartguard.entities.enums.AlertType;
import java.time.Instant;
import org.springframework.data.jpa.domain.Specification;

public final class AlertSpecifications {

    private AlertSpecifications() {
    }

    public static Specification<Alert> withFilters(
            AlertType type,
            AlertPriority priority,
            AlertStatus status,
            Long cameraId,
            Instant from,
            Instant to,
            String search
    ) {
        return Specification.allOf(
                typeEquals(type),
                priorityEquals(priority),
                statusEquals(status),
                cameraEquals(cameraId),
                occurredFrom(from),
                occurredTo(to),
                matchesSearch(search)
        );
    }

    private static Specification<Alert> typeEquals(AlertType type) {
        return (root, query, cb) -> type == null ? null : cb.equal(root.get("type"), type);
    }

    private static Specification<Alert> priorityEquals(AlertPriority priority) {
        return (root, query, cb) -> priority == null ? null : cb.equal(root.get("priority"), priority);
    }

    private static Specification<Alert> statusEquals(AlertStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    private static Specification<Alert> cameraEquals(Long cameraId) {
        return (root, query, cb) -> cameraId == null ? null : cb.equal(root.get("camera").get("id"), cameraId);
    }

    private static Specification<Alert> occurredFrom(Instant from) {
        return (root, query, cb) -> from == null ? null : cb.greaterThanOrEqualTo(root.get("occurredAt"), from);
    }

    private static Specification<Alert> occurredTo(Instant to) {
        return (root, query, cb) -> to == null ? null : cb.lessThanOrEqualTo(root.get("occurredAt"), to);
    }

    private static Specification<Alert> matchesSearch(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) {
                return null;
            }
            String pattern = "%" + search.trim().toLowerCase() + "%";
            var cameraJoin = root.join("camera");
            return cb.or(
                    cb.like(cb.lower(root.get("publicId")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(cameraJoin.get("name")), pattern)
            );
        };
    }
}
