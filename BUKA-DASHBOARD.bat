@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js tidak dijumpai. Pasang Node.js 18 atau lebih baharu dari https://nodejs.org
  pause
  exit /b 1
)
echo Membuka dashboard KSQ 2026...
node serve.js
pause
