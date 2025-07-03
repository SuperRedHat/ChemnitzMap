:: install.bat - Windows Dependency Installation Script
:: Location: Project root/install.bat
@echo off
chcp 65001 >nul
title Install ChemnitzMap Dependencies

echo 🚀 Starting ChemnitzMap dependency installation...
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found, please install Node.js 18+
    pause
    exit /b 1
)

:: Install root dependencies
echo 📦 Installing project dependencies...
call npm install

:: Install backend dependencies
echo.
echo 📦 Installing backend dependencies...
cd backend
call npm install
cd ..

:: Install frontend dependencies
echo.
echo 📦 Installing frontend dependencies...
cd frontend\vueChemnitzMap
call npm install
cd ..\..

echo.
echo ✅ All dependencies installed successfully!
echo.
pause