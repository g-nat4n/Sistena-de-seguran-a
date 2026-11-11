INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'Administrador do sistema'),
    ('MANAGER', 'Gerente da loja'),
    ('OPERATOR', 'Operador de monitoramento');

INSERT INTO stores (name, address, business_hours_start, business_hours_end, phone, created_at, updated_at)
VALUES (
    'SmartGuard Demo Store',
    'Av. Paulista, 1000 - São Paulo, SP',
    '09:00',
    '22:00',
    '(11) 4000-0000',
    NOW(),
    NOW()
);

-- Senha: admin123 (BCrypt) — autenticação completa na Fase 4
INSERT INTO users (name, email, password_hash, active, store_id, created_at, updated_at)
VALUES (
    'Administrador Demo',
    'admin@smartguard.local',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    TRUE,
    1,
    NOW(),
    NOW()
);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'admin@smartguard.local' AND r.name = 'ADMIN';

INSERT INTO cameras (name, identifier, location, type, description, status, demo_media_url, store_id, created_at, updated_at)
VALUES
    ('Entrada Principal', 'CAM-ENT-01', 'Hall de entrada', 'DOME', 'Cobertura da porta principal e filas', 'ONLINE',
     'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80', 1, NOW(), NOW()),
    ('Corredor Caixas', 'CAM-CX-02', 'Área de caixas', 'BULLET', 'Monitoramento das filas e caixas', 'ONLINE',
     'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80', 1, NOW(), NOW()),
    ('Setor Eletrônicos', 'CAM-EL-03', 'Corredor de eletrônicos', 'PTZ', 'Área de alto valor', 'ONLINE',
     'https://images.unsplash.com/photo-1567401893414-76b7b1dc5a5f?w=800&q=80', 1, NOW(), NOW()),
    ('Estoque Restrito', 'CAM-ST-04', 'Depósito / área restrita', 'DOME', 'Acesso controlado a colaboradores', 'ONLINE',
     'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80', 1, NOW(), NOW()),
    ('Estacionamento', 'CAM-PK-05', 'Estacionamento externo', 'BULLET', 'Entrada e saída de veículos', 'OFFLINE',
     'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80', 1, NOW(), NOW()),
    ('Provadores', 'CAM-PR-06', 'Área próxima aos provadores', 'FISHEYE', 'Movimentação em corredor adjacente', 'MAINTENANCE',
     'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80', 1, NOW(), NOW());

INSERT INTO detection_configurations (store_id, alert_type, default_priority, enabled, monitoring_area, notes, created_at, updated_at)
VALUES
    (1, 'POSSIBLE_CONCEALMENT', 'HIGH', TRUE, 'Corredores de alto valor', 'Eventos simulados — não são detecções reais', NOW(), NOW()),
    (1, 'SUSPICIOUS_MOVEMENT', 'MEDIUM', TRUE, 'Toda a loja', 'Padrões anômalos de trajetória', NOW(), NOW()),
    (1, 'RESTRICTED_AREA_ENTRY', 'CRITICAL', TRUE, 'Depósito / estoque', 'Áreas com acesso restrito', NOW(), NOW()),
    (1, 'UNUSUAL_DWELL', 'MEDIUM', TRUE, 'Provadores e corredores', 'Permanência acima do limiar', NOW(), NOW()),
    (1, 'AFTER_HOURS_MOVEMENT', 'HIGH', TRUE, 'Toda a loja', 'Fora do horário comercial', NOW(), NOW());

INSERT INTO alerts (public_id, type, priority, status, description, occurred_at, simulated, camera_id, created_at, updated_at)
VALUES
    ('ALT-2026-0001', 'POSSIBLE_CONCEALMENT', 'HIGH', 'NEW',
     'Evento simulado: possível ocultação de mercadoria próxima às prateleiras de eletrônicos.',
     NOW() - INTERVAL '35 minutes', TRUE, 3, NOW(), NOW()),
    ('ALT-2026-0002', 'SUSPICIOUS_MOVEMENT', 'MEDIUM', 'UNDER_REVIEW',
     'Evento simulado: trajetória atípica entre corredor de caixas e saída lateral.',
     NOW() - INTERVAL '1 hour 10 minutes', TRUE, 2, NOW(), NOW()),
    ('ALT-2026-0003', 'RESTRICTED_AREA_ENTRY', 'CRITICAL', 'NEW',
     'Evento simulado: entrada detectada em área restrita do depósito.',
     NOW() - INTERVAL '18 minutes', TRUE, 4, NOW(), NOW()),
    ('ALT-2026-0004', 'UNUSUAL_DWELL', 'MEDIUM', 'CONFIRMED',
     'Evento simulado: permanência incomum no corredor adjacente aos provadores.',
     NOW() - INTERVAL '3 hours', TRUE, 6, NOW(), NOW()),
    ('ALT-2026-0005', 'AFTER_HOURS_MOVEMENT', 'HIGH', 'DISCARDED',
     'Evento simulado: movimentação fora do horário comercial (falso positivo de limpeza).',
     NOW() - INTERVAL '14 hours', TRUE, 1, NOW(), NOW()),
    ('ALT-2026-0006', 'SUSPICIOUS_MOVEMENT', 'LOW', 'NEW',
     'Evento simulado: movimentação rápida entre setores sem interação com produtos.',
     NOW() - INTERVAL '8 minutes', TRUE, 2, NOW(), NOW()),
    ('ALT-2026-0007', 'POSSIBLE_CONCEALMENT', 'HIGH', 'UNDER_REVIEW',
     'Evento simulado: gesto compatível com ocultação próximo à entrada.',
     NOW() - INTERVAL '2 hours 20 minutes', TRUE, 1, NOW(), NOW()),
    ('ALT-2026-0008', 'RESTRICTED_AREA_ENTRY', 'CRITICAL', 'CONFIRMED',
     'Evento simulado: acesso não autorizado ao estoque confirmado pela operação.',
     NOW() - INTERVAL '5 hours', TRUE, 4, NOW(), NOW());

INSERT INTO alert_evidences (alert_id, media_url, media_type, caption, created_at)
SELECT a.id,
       c.demo_media_url,
       'image',
       'Evidência ilustrativa (simulada) — ' || a.public_id,
       NOW()
FROM alerts a
JOIN cameras c ON c.id = a.camera_id;

INSERT INTO occurrence_history (alert_id, previous_status, new_status, notes, changed_by, changed_at)
VALUES
    (2, 'NEW', 'UNDER_REVIEW', 'Operador iniciou análise do evento simulado.', 1, NOW() - INTERVAL '50 minutes'),
    (4, 'NEW', 'UNDER_REVIEW', 'Encaminhado para revisão.', 1, NOW() - INTERVAL '2 hours 40 minutes'),
    (4, 'UNDER_REVIEW', 'CONFIRMED', 'Padrão recorrente confirmado pela equipe.', 1, NOW() - INTERVAL '2 hours'),
    (5, 'NEW', 'DISCARDED', 'Equipe de limpeza identificada no registro.', 1, NOW() - INTERVAL '12 hours'),
    (7, 'NEW', 'UNDER_REVIEW', 'Aguardando confirmação visual adicional.', 1, NOW() - INTERVAL '2 hours'),
    (8, 'NEW', 'UNDER_REVIEW', 'Prioridade crítica — análise imediata.', 1, NOW() - INTERVAL '4 hours 30 minutes'),
    (8, 'UNDER_REVIEW', 'CONFIRMED', 'Confirmação operacional registrada.', 1, NOW() - INTERVAL '4 hours');
