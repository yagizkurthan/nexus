@echo off
echo ==================================================
echo       NEXUS AI - SYSTEM STARTUP PROTOCOL
echo ==================================================

echo 1. Initializing Neural Backend (Python/Flask)...
start "Nexus Backend" cmd /k "py app.py"

echo 2. Initializing Interface Layer (React/Vite)...
cd frontend
start "Nexus Frontend" cmd /k "npm run dev"

echo ==================================================
echo System Launch Sequence Initiated.
echo Please wait for the browser to open...
echo ==================================================
timeout /t 5
