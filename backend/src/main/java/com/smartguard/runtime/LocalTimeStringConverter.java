package com.smartguard.runtime;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Converter(autoApply = true)
public class LocalTimeStringConverter implements AttributeConverter<LocalTime, String> {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("HH:mm");

    @Override
    public String convertToDatabaseColumn(LocalTime attribute) {
        return attribute == null ? null : attribute.format(FMT);
    }

    @Override
    public LocalTime convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        String value = dbData.trim();
        if (value.length() >= 8) {
            return LocalTime.parse(value.substring(0, 8));
        }
        return LocalTime.parse(value, FMT);
    }
}
