-- Fase A: suporte a RTSP Intelbras (credenciais + estado de stream)
-- Senha fica criptografada; nunca deve ser exposta em APIs/logs.

ALTER TABLE cameras
    ADD COLUMN IF NOT EXISTS rtsp_host VARCHAR(255),
    ADD COLUMN IF NOT EXISTS rtsp_port INTEGER,
    ADD COLUMN IF NOT EXISTS rtsp_path VARCHAR(255),
    ADD COLUMN IF NOT EXISTS rtsp_username VARCHAR(120),
    ADD COLUMN IF NOT EXISTS rtsp_password_enc TEXT,
    ADD COLUMN IF NOT EXISTS stream_state VARCHAR(30) NOT NULL DEFAULT 'IDLE',
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_error VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_cameras_stream_state ON cameras (stream_state);
