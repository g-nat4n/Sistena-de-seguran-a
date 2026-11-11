package com.smartguard.services;

import com.smartguard.entities.enums.AlertType;
import org.springframework.stereotype.Component;

@Component
public class AlertLabelMapper {

    public String toLabel(AlertType type) {
        return switch (type) {
            case POSSIBLE_CONCEALMENT -> "Possível ocultação de mercadoria";
            case SUSPICIOUS_MOVEMENT -> "Movimentação suspeita";
            case RESTRICTED_AREA_ENTRY -> "Entrada em área restrita";
            case UNUSUAL_DWELL -> "Permanência incomum";
            case AFTER_HOURS_MOVEMENT -> "Movimentação fora do horário";
        };
    }

    public String toLabel(String typeName) {
        try {
            return toLabel(AlertType.valueOf(typeName));
        } catch (Exception ex) {
            return typeName;
        }
    }
}
