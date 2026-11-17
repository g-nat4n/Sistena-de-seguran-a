package com.smartguard.runtime;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@Converter(autoApply = true)
public class InstantStringConverter implements AttributeConverter<Instant, String> {

    private static final DateTimeFormatter SQLITE_DT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public String convertToDatabaseColumn(Instant attribute) {
        return attribute == null ? null : attribute.toString();
    }

    @Override
    public Instant convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        String value = dbData.trim();
        try {
            if (value.contains("T")) {
                if (!value.endsWith("Z") && !value.contains("+")) {
                    value = value + "Z";
                }
                return Instant.parse(value);
            }
            return LocalDateTime.parse(value.substring(0, Math.min(19, value.length())), SQLITE_DT)
                    .toInstant(ZoneOffset.UTC);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Não foi possível converter timestamp: " + dbData, ex);
        }
    }
}
