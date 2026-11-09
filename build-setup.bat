@echo off
chcp 65001 >nul
title Build LightPlayer Setup
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 ( echo [LOI] Chua cai Node.js. & pause & exit /b 1 )
call npm install
if errorlevel 1 ( echo [LOI] npm install that bai. & pause & exit /b 1 )
call npm run build:setup
if errorlevel 1 ( echo [LOI] Build that bai. & pause & exit /b 1 )
echo.
echo XONG! Bo cai nam o: %~dp0dist\LightPlayer-Setup.exe
echo Cai xong se co Start Menu + dang ky "Open with" cho mp4/mkv/webm/avi/mov/m4v.
explorer "%~dp0dist"
pause
