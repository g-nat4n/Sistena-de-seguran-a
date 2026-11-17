# Atualização do SmartGuard Windows

1. Faça backup (UI **Status do servidor** ou copie `%ProgramData%\SmartGuard\data`).
2. Pare os serviços:
   ```powershell
   sc stop SmartGuardVision
   sc stop SmartGuardApi
   ```
3. Substitua `smartguard-api.jar` (e o instalador Electron se houver nova UI).
4. Inicie os serviços:
   ```powershell
   sc start SmartGuardApi
   sc start SmartGuardVision
   ```
5. Abra o app e valide login + dashboard.

Os dados em `ProgramData` não são apagados na reinstalação do `.exe` (NSIS padrão).
