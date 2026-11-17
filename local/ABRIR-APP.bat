@echo off
chcp 65001 >nul
title SmartGuard AI
cd /d "%~dp0.."

set "APP=%~dp0..\desktop\dist\win-unpacked\SmartGuard AI.exe"
if not exist "%APP%" (
  echo App nao encontrado. Gere com:
  echo   cd frontend ^&^& npm run build:electron
  echo   copiar dist para desktop\renderer
  echo   cd desktop ^&^& npm run pack
  pause
  exit /b 1
)

where java >nul 2>&1
if errorlevel 1 (
  echo [AVISO] Java nao encontrado no PATH.
  echo Instale Eclipse Temurin 21 JRE para a API local funcionar.
  pause
)

start "" "%APP%"
exit /b 0
