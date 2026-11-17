CREATE TABLE IF NOT EXISTS app_settings (
    setting_key   VARCHAR(80) PRIMARY KEY,
    setting_value VARCHAR(500) NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL
);

INSERT INTO app_settings (setting_key, setting_value, updated_at)
VALUES ('registration_open', 'false', NOW())
ON CONFLICT (setting_key) DO NOTHING;
