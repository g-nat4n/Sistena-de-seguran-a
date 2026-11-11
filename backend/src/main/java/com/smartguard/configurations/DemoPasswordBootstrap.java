package com.smartguard.configurations;

import com.smartguard.repositories.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DemoPasswordBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String raw = "admin123";
        String encoded = passwordEncoder.encode(raw);
        List<String> emails = List.of(
                "admin@smartguard.local",
                "gerente@smartguard.local",
                "operador@smartguard.local"
        );

        emails.forEach(email -> userRepository.findByEmail(email).ifPresent(user -> {
            user.setPasswordHash(encoded);
            log.info("Senha demo sincronizada para {}", email);
        }));
    }
}
