:: deploy.bat - Windows Deployment Script
:: Location: Project root/deploy.bat
@echo off
chcp 65001 >nul
title ChemnitzMap Deployment Tool

echo.
echo ╔═══════════════════════════════════════════╗
echo ║     ChemnitzMap Automated Deployment 🚀   ║
echo ╚═══════════════════════════════════════════╝
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found, please install Node.js 18+
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

:: Run deployment script
node deploy.js

pause