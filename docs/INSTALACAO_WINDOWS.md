# Instalação Windows — SmartGuard AI

Aplicativo instalável com **banco SQLite criptografado (SQLCipher) por instalação**, serviço Windows no PC principal e clientes na LAN.

## Arquitetura (local independente)

**Cada PC = uma instalação completa:**

| Neste PC | O que existe |
|----------|--------------|
| App Electron | Interface + login |
| API local | Sobe junto com o app (porta 8080) |
| Banco SQLite+SQLCipher | `%ProgramData%\SmartGuard\data\seguranca_inteligente.db` |
| Usuários | Só deste PC (não compartilha com outro computador) |

Não há sincronização automática entre PCs. Instalar em outro computador cria **outro banco** e **outros logins**.

## Pré-requisitos

- Windows 10/11
- Java 21 (JRE) no PATH **ou** JRE embutido em `windows/runtime/jre`
- (Servidor) privilégio de Administrador para registrar serviços

## 1) Empacotar API

```powershell
.\windows\scripts\package-api.ps1
```

Gera `windows\dist\api\smartguard-api.jar`.

## 2) Instalar serviços (PC principal)

PowerShell **como Administrador**:

```powershell
.\windows\scripts\install-services.ps1
```

- Auto-start com o Windows
- Restart automático em falha
- Logs: `%ProgramData%\SmartGuard\logs`

## 3) App Electron / instalador

```powershell
cd frontend
npm ci
npm run build
# copiar dist → desktop/renderer
cd ..\desktop
Remove-Item -Recurse -Force renderer -ErrorAction SilentlyContinue
Copy-Item -Recurse ..\frontend\dist renderer
npm ci
npm run dist
```

Instalador gerado: `desktop\dist\SmartGuard-Setup-1.0.0.exe`

- Cria atalho na Área de Trabalho e Menu Iniciar
- Abre splash → verifica API → login

## 4) Configurar cliente

No app: **Configuração do app** (`/app-setup`) ou editar `%AppData%\smartguard-desktop\config.json`:

```json
{
  "mode": "client",
  "apiHost": "192.168.1.10",
  "apiPort": 8080,
  "useHttps": false
}
```

Libere a porta 8080 no Firewall do Windows **somente na rede privada**.

## Login demo

`admin@smartguard.local` / `admin123`

## Backup e restauração

- Pela UI: **Status do servidor** → Backup agora (ADMIN)
- Arquivos em `%ProgramData%\SmartGuard\data\backups\`
- Restore: `POST /api/admin/restore` (multipart) ou substituir o `.db` com o serviço parado
- O arquivo do banco já é SQLCipher (criptografado)

## Atualização

1. Parar serviços (`sc stop SmartGuardApi`)
2. Substituir `smartguard-api.jar` e o app Electron
3. Iniciar serviços
4. Dados em `ProgramData` **permanecem**

## Encerrar com segurança

- Fechar o Electron **não** para o monitoramento (serviços continuam)
- Para manutenção: `sc stop SmartGuardVision` depois `sc stop SmartGuardApi`

## HTTPS na LAN (opcional)

```powershell
.\windows\scripts\generate-https-cert.ps1
```

Configure as variáveis SSL no XML do WinSW / ambiente do serviço. Distribua confiança do certificado nos clientes.

## Checklist de testes

1. Ligar o PC principal → serviço sobe sozinho  
2. Fechar Electron → monitoramento/API seguem  
3. Desligar um cliente → demais ok  
4. Desconectar servidor da rede → banner “Servidor desconectado” nos clientes  
5. Reconectar → banner de restabelecido  
6. Reiniciar Windows → auto-start  
7. Matar processo da API → WinSW reinicia  
8. Backup/restore → dados íntegros  

## Desinstalação

```powershell
.\windows\scripts\uninstall-services.ps1
```

Dados em `%ProgramData%\SmartGuard` não são apagados automaticamente (backup seguro).
