-- Instalação limpa: apenas perfis. Sem usuários, câmeras ou alertas demo.
INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'Administrador do sistema'),
    ('MANAGER', 'Gerente da loja'),
    ('OPERATOR', 'Operador de monitoramento');
