package com.smartguard.configurations;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Contas demo desativadas no app local (sqlite).
 * Mantido apenas no perfil postgres para desenvolvimento com seed antigo.
 */
@Component
@Profile("postgres")
public class DemoPasswordBootstrap implements ApplicationRunner {

    @Override
    public void run(ApplicationArguments args) {
        // no-op no fluxo local limpo
    }
}
