-- Senhas serão sincronizadas no bootstrap da aplicação para admin123 (BCrypt)
INSERT INTO users (name, email, password_hash, active, store_id, created_at, updated_at)
VALUES
    ('Gerente Demo', 'gerente@smartguard.local', '$2a$10$DYGPF372l7HekHsaejB1QO0xgNRUjVcY2/2v0qxkWJNgkt/XW0aLa', TRUE, 1, NOW(), NOW()),
    ('Operador Demo', 'operador@smartguard.local', '$2a$10$DYGPF372l7HekHsaejB1QO0xgNRUjVcY2/2v0qxkWJNgkt/XW0aLa', TRUE, 1, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

UPDATE users
SET password_hash = '$2a$10$DYGPF372l7HekHsaejB1QO0xgNRUjVcY2/2v0qxkWJNgkt/XW0aLa',
    updated_at = NOW()
WHERE email IN ('admin@smartguard.local', 'gerente@smartguard.local', 'operador@smartguard.local');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.email = 'gerente@smartguard.local' AND r.name = 'MANAGER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.email = 'operador@smartguard.local' AND r.name = 'OPERATOR'
ON CONFLICT DO NOTHING;
