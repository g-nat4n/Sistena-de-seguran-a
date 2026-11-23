; Fecha processos do SmartGuard antes de instalar/atualizar
!macro customInit
  nsExec::ExecToLog 'taskkill /F /IM "SmartGuard AI.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "SmartGuard-AI-Setup.exe" /T'
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match ''smartguard-api\.jar|uvicorn app\.main'' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"'
!macroend

!macro customInstall
  DetailPrint "SmartGuard AI instalado. Java e Python ja vem embutidos."
!macroend
