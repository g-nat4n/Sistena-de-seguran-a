CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE stores (
    id                    BIGSERIAL PRIMARY KEY,
    name                  VARCHAR(120) NOT NULL,
    address               VARCHAR(255),
    business_hours_start  TIME,
    business_hours_end    TIME,
    phone                 VARCHAR(30),
    created_at            TIMESTAMPTZ  NOT NULL,
    updated_at            TIMESTAMPTZ  NOT NULL
);

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    store_id      BIGINT REFERENCES stores (id),
    created_at    TIMESTAMPTZ  NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE cameras (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(120) NOT NULL,
    identifier     VARCHAR(60)  NOT NULL UNIQUE,
    location       VARCHAR(120) NOT NULL,
    type           VARCHAR(30)  NOT NULL,
    description    VARCHAR(500),
    status         VARCHAR(30)  NOT NULL,
    demo_media_url VARCHAR(500),
    rtsp_url       VARCHAR(500),
    store_id       BIGINT       NOT NULL REFERENCES stores (id),
    created_at     TIMESTAMPTZ  NOT NULL,
    updated_at     TIMESTAMPTZ  NOT NULL
);

CREATE TABLE alerts (
    id           BIGSERIAL PRIMARY KEY,
    public_id    VARCHAR(40)  NOT NULL UNIQUE,
    type         VARCHAR(40)  NOT NULL,
    priority     VARCHAR(20)  NOT NULL,
    status       VARCHAR(20)  NOT NULL,
    description  VARCHAR(500) NOT NULL,
    occurred_at  TIMESTAMPTZ  NOT NULL,
    simulated    BOOLEAN      NOT NULL DEFAULT TRUE,
    camera_id    BIGINT       NOT NULL REFERENCES cameras (id),
    assigned_to  BIGINT REFERENCES users (id),
    created_at   TIMESTAMPTZ  NOT NULL,
    updated_at   TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_alerts_occurred_at ON alerts (occurred_at DESC);
CREATE INDEX idx_alerts_status ON alerts (status);
CREATE INDEX idx_alerts_type ON alerts (type);
CREATE INDEX idx_alerts_camera_id ON alerts (camera_id);

CREATE TABLE alert_evidences (
    id         BIGSERIAL PRIMARY KEY,
    alert_id   BIGINT       NOT NULL REFERENCES alerts (id) ON DELETE CASCADE,
    media_url  VARCHAR(500) NOT NULL,
    media_type VARCHAR(30),
    caption    VARCHAR(255),
    created_at TIMESTAMPTZ  NOT NULL
);

CREATE TABLE occurrence_history (
    id              BIGSERIAL PRIMARY KEY,
    alert_id        BIGINT      NOT NULL REFERENCES alerts (id) ON DELETE CASCADE,
    previous_status VARCHAR(20),
    new_status      VARCHAR(20) NOT NULL,
    notes           VARCHAR(500),
    changed_by      BIGINT REFERENCES users (id),
    changed_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_occurrence_history_alert_id ON occurrence_history (alert_id);

CREATE TABLE detection_configurations (
    id               BIGSERIAL PRIMARY KEY,
    store_id         BIGINT       NOT NULL REFERENCES stores (id),
    alert_type       VARCHAR(40)  NOT NULL,
    default_priority VARCHAR(20)  NOT NULL,
    enabled          BOOLEAN      NOT NULL DEFAULT TRUE,
    monitoring_area  VARCHAR(255),
    notes            VARCHAR(500),
    created_at       TIMESTAMPTZ  NOT NULL,
    updated_at       TIMESTAMPTZ  NOT NULL,
    UNIQUE (store_id, alert_type)
);
