:: start.bat - Windows Start Script
:: Location: Project root/start.bat
@echo off
chcp 65001 >nul
title ChemnitzMap Application

echo.
echo ╔═══════════════════════════════════════════╗
echo ║     ChemnitzMap One-Click Start Tool 🚀   ║
echo ╚═══════════════════════════════════════════╝
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found, please install Node.js 18+
    pause
    exit /b 1
)

:: Run start script
node start.js
