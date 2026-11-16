-- Evidências de frames RTSP podem usar URLs locais do Vision Service
ALTER TABLE alert_evidences
    ALTER COLUMN media_url TYPE VARCHAR(1000);
