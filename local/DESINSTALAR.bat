@echo off
chcp 65001 >nul
title SmartGuard AI — Desinstalar
cd /d "%~dp0.."

echo.
echo Isso remove os containers do SmartGuard.
echo.
choice /C SN /M "Apagar tambem o banco de dados e evidencias"
if errorlevel 2 (
  docker compose -f docker-compose.local.yml down
  echo Containers removidos. Dados do banco mantidos.
) else (
  docker compose -f docker-compose.local.yml down -v
  echo Containers e dados removidos.
)

set "DESKTOP=%USERPROFILE%\Desktop"
if exist "%DESKTOP%\SmartGuard AI.lnk" del "%DESKTOP%\SmartGuard AI.lnk"
if exist "%USERPROFILE%\OneDrive\Desktop\SmartGuard AI.lnk" del "%USERPROFILE%\OneDrive\Desktop\SmartGuard AI.lnk"

echo.
pause
