@echo off
chcp 65001 >nul
title Build LightPlayer
cd /d "%~dp0"
echo ==============================
echo   BUILD LIGHTPLAYER (.exe)
echo ==============================
where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Node.js. Tai ban LTS tai https://nodejs.org roi chay lai.
  pause & exit /b 1
)
echo [1/2] Cai thu vien (lan dau hoi lau)...
call npm install
if errorlevel 1 ( echo [LOI] npm install that bai. & pause & exit /b 1 )
echo [2/2] Dong goi exe...
call npm run build
if errorlevel 1 ( echo [LOI] Build that bai. & pause & exit /b 1 )
echo.
echo XONG! File nam o: %~dp0dist\LightPlayer.exe
explorer "%~dp0dist"
pause
