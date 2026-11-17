# Backup e restauração

## Onde ficam os dados

- Banco criptografado: `%ProgramData%\SmartGuard\data\seguranca_inteligente.db`
- Evidências: `%ProgramData%\SmartGuard\data\evidence\`
- Backups gerados: `%ProgramData%\SmartGuard\data\backups\`
- Chave SQLCipher: Windows Credential Manager (`SmartGuard/SQLCipher`) ou `.dbkey` no data dir

## Backup pela API / UI

Usuário **ADMIN**:

1. Abra **Status do servidor**
2. Clique **Backup agora**
3. Um `.zip` criptografado (contém o `.db` SQLCipher + evidências) é gerado

Também: `POST /api/admin/backup` com JWT de admin.

## Restauração

1. Pare o serviço: `sc stop SmartGuardApi`
2. Envie o zip via `POST /api/admin/restore` (com API em modo manutenção) **ou**
3. Extraia o `.db` do zip e substitua `seguranca_inteligente.db`
4. `sc start SmartGuardApi`

Reinicie o app Electron após restaurar.

## Boas práticas

- Backup diário automático via Agendador de Tarefas chamando a API ou copiando a pasta `backups`
- Guarde cópias fora do PC da loja (HD externo)
- Sem a chave do Credential Manager, o `.db` não abre
