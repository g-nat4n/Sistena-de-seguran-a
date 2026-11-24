package com.smartguard.services;

import jakarta.mail.internet.MimeMessage;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotifyService {

    private final AppSettingsService appSettingsService;

    public List<String> send(String subject, String text) {
        List<String> results = new ArrayList<>();
        if (!appSettingsService.emailEnabled()) {
            results.add("E-mail desligado nas configurações");
            return results;
        }

        String host = appSettingsService.smtpHost();
        String from = appSettingsService.emailFrom();
        List<String> to = appSettingsService.emailRecipients();
        if (host.isBlank()) {
            results.add("SMTP host não configurado");
            return results;
        }
        if (from.isBlank()) {
            results.add("Remetente (From) não configurado");
            return results;
        }
        if (to.isEmpty()) {
            results.add("Nenhum destinatário configurado");
            return results;
        }

        try {
            JavaMailSenderImpl sender = new JavaMailSenderImpl();
            sender.setHost(host);
            sender.setPort(appSettingsService.smtpPort());
            String username = appSettingsService.smtpUsername();
            String password = appSettingsService.smtpPassword();
            if (!username.isBlank()) {
                sender.setUsername(username);
            }
            if (!password.isBlank()) {
                sender.setPassword(password);
            }

            Properties props = sender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", (!username.isBlank() && !password.isBlank()) ? "true" : "false");
            props.put("mail.smtp.starttls.enable", appSettingsService.smtpStartTls() ? "true" : "false");
            props.put("mail.smtp.connectiontimeout", "8000");
            props.put("mail.smtp.timeout", "12000");
            props.put("mail.smtp.writetimeout", "12000");

            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to.toArray(String[]::new));
            helper.setSubject(subject);
            helper.setText(text, false);
            sender.send(message);
            results.add("E-mail OK → " + String.join(", ", to));
        } catch (Exception ex) {
            log.warn("Falha ao enviar e-mail: {}", ex.toString());
            results.add("E-mail falhou: " + ex.getMessage());
        }
        return results;
    }
}
