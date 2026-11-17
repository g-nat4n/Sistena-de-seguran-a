@echo off
chcp 65001 >nul
title SmartGuard AI — Iniciar
cd /d "%~dp0.."

where docker >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Docker nao encontrado. Instale o Docker Desktop.
  pause
  exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Abra o Docker Desktop e aguarde iniciar.
  pause
  exit /b 1
)

echo Iniciando SmartGuard...
docker compose -f docker-compose.local.yml up -d
if errorlevel 1 (
  echo [ERRO] Nao foi possivel iniciar. Rode local\INSTALAR.bat primeiro.
  pause
  exit /b 1
)

timeout /t 3 /nobreak >nul
start "" "http://localhost:3080"
echo Aberto em http://localhost:3080
exit /b 0
