@echo off
title NimbrayAI Beta
cd /d %~dp0
if not exist node_modules (
  echo Installation des dependances...
  call npm.cmd install --no-audit --no-fund
)
if not exist .env.local (
  copy .env.example .env.local
)
echo Lancement de NimbrayAI Beta...
call npm.cmd run dev
pause
