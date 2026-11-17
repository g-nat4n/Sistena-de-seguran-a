@echo off
chcp 65001 >nul
title SmartGuard AI — Parar
cd /d "%~dp0.."

echo Parando SmartGuard...
docker compose -f docker-compose.local.yml stop
echo Pronto. Os dados do banco ficam salvos no PC.
pause
