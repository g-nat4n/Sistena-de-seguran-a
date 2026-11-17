# Serviços Windows (SmartGuard)

O PC principal da loja roda a API e a visão como **serviços Windows**, independentes do Electron.

## Pré-requisitos no PC servidor

1. JRE 21 em `windows/runtime/jre` (ou ajuste o XML do WinSW)
2. JAR da API em `windows/dist/api/smartguard-api.jar` (`scripts/package-api.ps1`)
3. (Opcional) Python embutido + app Vision em `windows/vision`

## Instalar serviços

PowerShell **como Administrador**:

```powershell
.\windows\scripts\package-api.ps1
.\windows\scripts\install-services.ps1
```

Serviços:

- `SmartGuardApi` — porta 8080, SQLite em `%ProgramData%\SmartGuard\data\`
- `SmartGuardVision` — porta 8090 (depende da API)

## Parar / iniciar

```powershell
sc stop SmartGuardApi
sc start SmartGuardApi
```

Ou pela tela **Status do servidor** no app (ADMIN).

## Logs

`%ProgramData%\SmartGuard\logs\`
