package com.smartguard.services;

import com.smartguard.dto.auth.LoginRequest;
import com.smartguard.dto.auth.LoginResponse;
import com.smartguard.dto.auth.UserResponse;
import com.smartguard.entities.User;
import com.smartguard.exceptions.BusinessException;
import com.smartguard.exceptions.ResourceNotFoundException;
import com.smartguard.repositories.UserRepository;
import com.smartguard.security.JwtService;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (AuthenticationException ex) {
            throw new BusinessException("Credenciais inválidas");
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        var roles = user.getRoles().stream().map(role -> role.getName()).collect(Collectors.toSet());
        String token = jwtService.generateToken(user.getEmail(), roles.stream().toList());

        return new LoginResponse(
                token,
                "Bearer",
                user.getId(),
                user.getName(),
                user.getEmail(),
                roles
        );
    }

    @Transactional(readOnly = true)
    public UserResponse me(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        return toUserResponse(user);
    }

    @Transactional(readOnly = true)
    public java.util.List<UserResponse> listUsers() {
        return userRepository.findAll().stream().map(this::toUserResponse).toList();
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.isActive(),
                user.getStore() == null ? null : user.getStore().getId(),
                user.getStore() == null ? null : user.getStore().getName(),
                user.getRoles().stream().map(role -> role.getName()).collect(Collectors.toSet())
        );
    }
}
