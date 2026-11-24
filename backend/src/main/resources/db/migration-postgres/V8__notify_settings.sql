ALTER TABLE app_settings
    ALTER COLUMN setting_value TYPE VARCHAR(2000);

INSERT INTO app_settings (setting_key, setting_value, updated_at)
VALUES
    ('notify_telegram_enabled', 'false', NOW()),
    ('notify_email_enabled', 'false', NOW()),
    ('notify_min_priority', 'HIGH', NOW())
ON CONFLICT (setting_key) DO NOTHING;
