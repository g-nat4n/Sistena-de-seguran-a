package com.smartguard.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterEstablishmentRequest(
        @NotBlank @Size(max = 120) String storeName,
        @NotBlank @Size(max = 120) String adminName,
        @NotBlank @Email @Size(max = 120) String email,
        @NotBlank @Size(min = 6, max = 100) String password,
        @Size(max = 255) String address,
        @Size(max = 30) String phone
) {
}
