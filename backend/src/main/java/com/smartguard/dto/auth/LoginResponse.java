package com.smartguard.dto.auth;

import java.util.Set;

public record LoginResponse(
        String accessToken,
        String tokenType,
        Long userId,
        String name,
        String email,
        Set<String> roles
) {
}
