package com.smartguard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SmartGuardApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartGuardApplication.class, args);
    }
}
