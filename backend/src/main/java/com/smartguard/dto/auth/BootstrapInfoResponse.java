package com.smartguard.dto.auth;

public record BootstrapInfoResponse(
        boolean needsSetup,
        boolean registrationOpen,
        boolean hasLocalUsers,
        String message
) {
}
