-- Espaço extra para tokens SMTP/Telegram (SQLite ignora length, mas documenta o contrato)
-- Configurações de notificação usam chaves em app_settings (sem tabela nova).
INSERT OR IGNORE INTO app_settings (setting_key, setting_value, updated_at)
VALUES
    ('notify_telegram_enabled', 'false', datetime('now')),
    ('notify_email_enabled', 'false', datetime('now')),
    ('notify_min_priority', 'HIGH', datetime('now'));
