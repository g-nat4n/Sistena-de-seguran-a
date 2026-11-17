CREATE TABLE roles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE stores (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    name                  VARCHAR(120) NOT NULL,
    address               VARCHAR(255),
    business_hours_start  TIME,
    business_hours_end    TIME,
    phone                 VARCHAR(30),
    created_at            TEXT NOT NULL,
    updated_at            TEXT NOT NULL
);

CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    active        INTEGER      NOT NULL DEFAULT 1,
    store_id      INTEGER REFERENCES stores (id),
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);

CREATE TABLE user_roles (
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE cameras (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    name               VARCHAR(120) NOT NULL,
    identifier         VARCHAR(60)  NOT NULL UNIQUE,
    location           VARCHAR(120) NOT NULL,
    type               VARCHAR(30)  NOT NULL,
    description        VARCHAR(500),
    status             VARCHAR(30)  NOT NULL,
    demo_media_url     VARCHAR(1000),
    rtsp_url           VARCHAR(500),
    store_id           INTEGER      NOT NULL REFERENCES stores (id),
    rtsp_host          VARCHAR(255),
    rtsp_port          INTEGER,
    rtsp_path          VARCHAR(255),
    rtsp_username      VARCHAR(120),
    rtsp_password_enc  TEXT,
    stream_state       VARCHAR(30)  NOT NULL DEFAULT 'IDLE',
    last_seen_at       TEXT,
    last_tested_at     TEXT,
    last_error         VARCHAR(500),
    created_at         TEXT NOT NULL,
    updated_at         TEXT NOT NULL
);

CREATE INDEX idx_cameras_stream_state ON cameras (stream_state);

CREATE TABLE alerts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id    VARCHAR(40)  NOT NULL UNIQUE,
    type         VARCHAR(40)  NOT NULL,
    priority     VARCHAR(20)  NOT NULL,
    status       VARCHAR(20)  NOT NULL,
    description  VARCHAR(500) NOT NULL,
    occurred_at  TEXT NOT NULL,
    simulated    INTEGER      NOT NULL DEFAULT 1,
    camera_id    INTEGER      NOT NULL REFERENCES cameras (id),
    assigned_to  INTEGER REFERENCES users (id),
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
);

CREATE INDEX idx_alerts_occurred_at ON alerts (occurred_at DESC);
CREATE INDEX idx_alerts_status ON alerts (status);
CREATE INDEX idx_alerts_type ON alerts (type);
CREATE INDEX idx_alerts_camera_id ON alerts (camera_id);

CREATE TABLE alert_evidences (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id   INTEGER      NOT NULL REFERENCES alerts (id) ON DELETE CASCADE,
    media_url  VARCHAR(1000) NOT NULL,
    media_type VARCHAR(30),
    caption    VARCHAR(255),
    created_at TEXT NOT NULL
);

CREATE TABLE occurrence_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id        INTEGER     NOT NULL REFERENCES alerts (id) ON DELETE CASCADE,
    previous_status VARCHAR(20),
    new_status      VARCHAR(20) NOT NULL,
    notes           VARCHAR(500),
    changed_by      INTEGER REFERENCES users (id),
    changed_at      TEXT NOT NULL
);

CREATE INDEX idx_occurrence_history_alert_id ON occurrence_history (alert_id);

CREATE TABLE detection_configurations (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id         INTEGER      NOT NULL REFERENCES stores (id),
    alert_type       VARCHAR(40)  NOT NULL,
    default_priority VARCHAR(20)  NOT NULL,
    enabled          INTEGER      NOT NULL DEFAULT 1,
    monitoring_area  VARCHAR(255),
    notes            VARCHAR(500),
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL,
    UNIQUE (store_id, alert_type)
);

CREATE TABLE audit_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    action      VARCHAR(80)  NOT NULL,
    actor_email VARCHAR(120),
    details     VARCHAR(1000),
    ip_address  VARCHAR(64),
    created_at  TEXT NOT NULL
);

CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
