@echo off
chcp 65001 >nul
title Build LightPlayer
cd /d "%~dp0"
echo ==============================
echo   BUILD LIGHTPLAYER (thu muc, khoi dong nhanh)
echo ==============================
where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Node.js. Tai ban LTS tai https://nodejs.org roi chay lai.
  pause & exit /b 1
)
echo [1/3] Cai thu vien (lan dau hoi lau)...
call npm install
if errorlevel 1 ( echo [LOI] npm install that bai. & pause & exit /b 1 )
echo [2/3] Dong goi...
if exist dist\LightPlayer rmdir /s /q dist\LightPlayer
if exist dist\win-unpacked rmdir /s /q dist\win-unpacked
call npm run build
if errorlevel 1 ( echo [LOI] Build that bai. & pause & exit /b 1 )
echo [3/3] Doi ten thu muc...
ren dist\win-unpacked LightPlayer
echo.
echo XONG! Chay file: %~dp0dist\LightPlayer\LightPlayer.exe
echo (Giu nguyen ca thu muc LightPlayer, co the copy di noi khac. Tao shortcut tu LightPlayer.exe.)
explorer "%~dp0dist\LightPlayer"
pause
