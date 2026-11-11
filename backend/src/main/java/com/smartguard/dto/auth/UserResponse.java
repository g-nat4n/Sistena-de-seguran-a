package com.smartguard.dto.auth;

import java.util.Set;

public record UserResponse(
        Long id,
        String name,
        String email,
        boolean active,
        Long storeId,
        String storeName,
        Set<String> roles
) {
}
