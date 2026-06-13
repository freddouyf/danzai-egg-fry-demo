@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title Danzai Egg Fry - Phone Play Server

set "NODE=%~dp0tools\node\node.exe"
set "VITE=%~dp0node_modules\vite\bin\vite.js"
set "CHECKER=%~dp0tools\check-phone-server.mjs"
set "STATUS=%~dp0phone-server-status.txt"
set "LAN_IP="

> "%STATUS%" echo STARTING %DATE% %TIME%

if not exist "%NODE%" (
  echo ERROR: Portable Node.js was not found.
  >> "%STATUS%" echo ERROR: Node.js not found at %NODE%
  echo Expected path:
  echo %NODE%
  pause
  exit /b 1
)

if not exist "%VITE%" (
  echo ERROR: Vite was not found.
  >> "%STATUS%" echo ERROR: Vite not found at %VITE%
  echo Run npm install in this project first.
  pause
  exit /b 1
)

for /f "tokens=2 delims=:" %%I in ('ipconfig ^| findstr /R /C:"IPv4.*:"') do (
  set "CANDIDATE=%%I"
  set "CANDIDATE=!CANDIDATE: =!"
  echo !CANDIDATE! | findstr /R /B "192\.168\. 10\. 172\." >nul
  if not errorlevel 1 if not defined LAN_IP set "LAN_IP=!CANDIDATE!"
)

if not defined LAN_IP (
  echo ERROR: Could not detect a local network IPv4 address.
  >> "%STATUS%" echo ERROR: Local IPv4 address not found
  echo Connect this PC to Wi-Fi and try again.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   Keep this window open while playing on your phone.
echo.
echo   Phone URL: http://%LAN_IP%:5173
echo ============================================================
echo.
echo If Windows asks about network access, choose Allow.
echo Press Ctrl+C when you want to stop the game server.
echo.

>> "%STATUS%" echo URL=http://%LAN_IP%:5173
>> "%STATUS%" echo LAUNCHING VITE

if exist "%CHECKER%" (
  start "" /b "%NODE%" "%CHECKER%" "%STATUS%" "%LAN_IP%"
)

"%NODE%" "%VITE%" --host 0.0.0.0 --port 5173 --strictPort
set "EXIT_CODE=%ERRORLEVEL%"

>> "%STATUS%" echo STOPPED exit=%EXIT_CODE% %DATE% %TIME%
echo.
echo The game server stopped with exit code %EXIT_CODE%.
echo Diagnostic file:
echo %STATUS%
pause
exit /b %EXIT_CODE%
