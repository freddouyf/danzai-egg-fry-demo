@echo off
setlocal
cd /d "%~dp0"
title Danzai - ChatGPT Public Playtest

set "NODE=%~dp0tools\node\node.exe"
set "VITE=%~dp0node_modules\vite\bin\vite.js"
set "NPM_CLI=%~dp0tools\node\node_modules\npm\bin\npm-cli.js"
set "SSH=%WINDIR%\System32\OpenSSH\ssh.exe"

echo.
echo ============================================================
echo   Danzai ChatGPT public playtest
echo   Keep this window open while ChatGPT is playing.
echo ============================================================
echo.

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:"127.0.0.1:4173 .*LISTENING" /C:"0.0.0.0:4173 .*LISTENING"') do (
  taskkill /PID %%P /F >nul 2>nul
)

echo Building the static game...
"%NODE%" "%NPM_CLI%" run build
if errorlevel 1 (
  echo Build failed.
  pause
  exit /b 1
)

start "Danzai Local Server" /min "%NODE%" "%VITE%" preview --host 127.0.0.1 --port 4173 --strictPort
timeout /t 2 /nobreak >nul

echo Creating a temporary HTTPS address...
echo Copy the https address ending in .lhr.life to ChatGPT.
echo.

"%SSH%" -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:127.0.0.1:4173 nokey@localhost.run

echo.
echo The public address has stopped.
pause
