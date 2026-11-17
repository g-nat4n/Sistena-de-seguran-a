@echo off
chcp 65001 >nul
title SmartGuard AI — Instalar
cd /d "%~dp0.."

echo.
echo  ========================================
echo   SmartGuard AI — Instalacao local
echo  ========================================
echo.

where docker >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Docker nao encontrado.
  echo Instale o Docker Desktop: https://www.docker.com/products/docker-desktop/
  echo Depois reinicie o PC e rode este arquivo de novo.
  pause
  exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Docker Desktop nao esta em execucao.
  echo Abra o Docker Desktop e aguarde ficar "Running", depois rode de novo.
  pause
  exit /b 1
)

echo [1/3] Baixando e montando banco, API, IA e interface...
echo       (na primeira vez pode demorar varios minutos)
echo.
docker compose -f docker-compose.local.yml up -d --build
if errorlevel 1 (
  echo.
  echo [ERRO] Falha na instalacao. Veja as mensagens acima.
  pause
  exit /b 1
)

echo.
echo [2/3] Criando atalho na Area de Trabalho...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0criar-atalho.ps1"

echo.
echo [3/3] Abrindo o SmartGuard...
start "" "http://localhost:3080"

echo.
echo  Pronto! App em: http://localhost:3080
echo.
echo  Login demo:
echo    admin@smartguard.local / admin123
echo.
echo  Para iniciar depois: local\INICIAR.bat
echo  Para parar:         local\PARAR.bat
echo.
pause
