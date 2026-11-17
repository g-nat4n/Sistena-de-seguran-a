package com.smartguard.controllers;

import com.smartguard.dto.auth.BootstrapInfoResponse;
import com.smartguard.dto.auth.CreateUserRequest;
import com.smartguard.dto.auth.LoginRequest;
import com.smartguard.dto.auth.LoginResponse;
import com.smartguard.dto.auth.RegisterUserRequest;
import com.smartguard.dto.auth.UserResponse;
import com.smartguard.services.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/bootstrap-info")
    public BootstrapInfoResponse bootstrapInfo() {
        return authService.bootstrapInfo();
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        return authService.login(request, clientIp(http));
    }

    @PostMapping("/register")
    public LoginResponse register(@Valid @RequestBody RegisterUserRequest request, HttpServletRequest http) {
        return authService.registerUser(request, clientIp(http));
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UserDetails principal) {
        return authService.me(principal.getUsername());
    }

    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<UserResponse> users() {
        return authService.listUsers();
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse createUser(
            @Valid @RequestBody CreateUserRequest request,
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest http
    ) {
        return authService.createUser(request, principal.getUsername(), clientIp(http));
    }

    private static String clientIp(HttpServletRequest http) {
        String forwarded = http.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return http.getRemoteAddr();
    }
}
