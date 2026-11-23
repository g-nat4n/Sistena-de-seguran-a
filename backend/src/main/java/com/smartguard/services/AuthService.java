package com.smartguard.services;

import com.smartguard.dto.auth.BootstrapInfoResponse;
import com.smartguard.dto.auth.CreateUserRequest;
import com.smartguard.dto.auth.LoginRequest;
import com.smartguard.dto.auth.LoginResponse;
import com.smartguard.dto.auth.RegisterUserRequest;
import com.smartguard.dto.auth.UserResponse;
import com.smartguard.entities.Role;
import com.smartguard.entities.Store;
import com.smartguard.entities.User;
import com.smartguard.exceptions.BusinessException;
import com.smartguard.exceptions.ResourceNotFoundException;
import com.smartguard.repositories.RoleRepository;
import com.smartguard.repositories.StoreRepository;
import com.smartguard.repositories.UserRepository;
import com.smartguard.security.JwtService;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final StoreRepository storeRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final LoginRateLimiter loginRateLimiter;
    private final AuditService auditService;
    private final AppSettingsService appSettingsService;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request, String ipAddress) {
        String email = request.email() == null ? "" : request.email().trim().toLowerCase(Locale.ROOT);
        String key = email + "|" + (ipAddress == null ? "" : ipAddress);
        loginRateLimiter.checkAllowed(key);
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password())
            );
        } catch (org.springframework.security.authentication.BadCredentialsException ex) {
            loginRateLimiter.recordFailure(key);
            auditService.record("LOGIN_FAILED", email, "Credenciais inválidas", ipAddress);
            throw new BusinessException("Credenciais inválidas");
        } catch (org.springframework.security.authentication.DisabledException ex) {
            loginRateLimiter.recordFailure(key);
            throw new BusinessException("Usuário desativado");
        } catch (AuthenticationException ex) {
            loginRateLimiter.recordFailure(key);
            auditService.record("LOGIN_FAILED", email, ex.getClass().getSimpleName(), ipAddress);
            throw new BusinessException("Falha na autenticação: " + ex.getClass().getSimpleName());
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        loginRateLimiter.recordSuccess(key);
        auditService.record("LOGIN_SUCCESS", user.getEmail(), "Login OK", ipAddress);

        var roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
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

    @Transactional(readOnly = true)
    public BootstrapInfoResponse bootstrapInfo() {
        long users = userRepository.count();
        boolean needsSetup = users == 0;
        boolean registrationOpen = needsSetup || appSettingsService.isRegistrationOpen();
        String message = needsSetup
                ? "Primeiro acesso: cadastre o administrador deste computador."
                : (registrationOpen
                        ? "Cadastro liberado pelo administrador."
                        : "Faça login. Novos cadastros só com liberação do administrador.");
        return new BootstrapInfoResponse(needsSetup, registrationOpen, users > 0, message);
    }

    /**
     * Cadastro de usuário nesta instalação.
     * - Sem usuários: vira ADMIN e cria a loja vazia deste PC.
     * - Com usuários: só se o admin liberou o cadastro (vira OPERATOR).
     */
    @Transactional
    public LoginResponse registerUser(RegisterUserRequest request, String ip) {
        long userCount = userRepository.count();
        boolean firstUser = userCount == 0;

        if (!firstUser && !appSettingsService.isRegistrationOpen()) {
            throw new BusinessException(
                    "Já existe administrador neste PC. Faça login ou peça para liberar novos cadastros em Configurações."
            );
        }

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.findByEmail(email).isPresent()) {
            throw new BusinessException("Este e-mail já está cadastrado neste computador");
        }

        String roleName = firstUser ? "ADMIN" : "OPERATOR";
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new BusinessException("Perfil " + roleName + " não configurado"));

        Store store = storeRepository.findAll().stream().findFirst().orElse(null);
        if (store == null) {
            store = Store.builder()
                    .name("Minha loja")
                    .businessHoursStart(LocalTime.of(9, 0))
                    .businessHoursEnd(LocalTime.of(22, 0))
                    .build();
            storeRepository.save(store);
        }

        User user = User.builder()
                .name(request.name().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .active(true)
                .store(store)
                .roles(new HashSet<>(Set.of(role)))
                .build();
        userRepository.saveAndFlush(user);

        if (firstUser) {
            appSettingsService.setRegistrationOpen(false);
            auditService.record("FIRST_ADMIN_CREATED", email, "Administrador inicial deste PC", ip);
        } else {
            auditService.record("USER_SELF_REGISTERED", email, "Cadastro público OPERATOR", ip);
        }

        return login(new LoginRequest(email, request.password()), ip);
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request, String actorEmail, String ip) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.findByEmail(email).isPresent()) {
            throw new BusinessException("E-mail já cadastrado");
        }
        Set<String> roleNames = request.roles() == null || request.roles().isEmpty()
                ? Set.of("OPERATOR")
                : request.roles();

        Set<Role> roles = new HashSet<>();
        for (String roleName : roleNames) {
            Role role = roleRepository.findByName(roleName.toUpperCase(Locale.ROOT))
                    .orElseThrow(() -> new BusinessException("Perfil inválido: " + roleName));
            roles.add(role);
        }

        Store store = storeRepository.findAll().stream().findFirst().orElse(null);

        User user = User.builder()
                .name(request.name().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .active(true)
                .store(store)
                .roles(roles)
                .build();

        userRepository.save(user);
        auditService.record("USER_CREATED", actorEmail, "Criou usuário " + email, ip);
        return toUserResponse(user);
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.isActive(),
                user.getStore() == null ? null : user.getStore().getId(),
                user.getStore() == null ? null : user.getStore().getName(),
                user.getRoles().stream().map(Role::getName).collect(Collectors.toSet())
        );
    }
}
