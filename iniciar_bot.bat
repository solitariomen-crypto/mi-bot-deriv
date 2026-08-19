@echo off
chcp 65001 >nul
title Mi Bot Deriv - Acumulador Volatilidad 10

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                    🤖 MI BOT DERIV                          ║
echo  ║              Acumulador Automático - Volatilidad 10         ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

set "BOT_DIR=%~dp0"
cd /d "%BOT_DIR%"

echo  📁 Carpeta del bot: %BOT_DIR%
echo.

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo  ❌ Python no encontrado. Instala Python de https://python.org
    echo  📥 Descarga: https://www.python.org/downloads/windows/
    pause
    exit /b 1
)

echo  ✅ Python detectado
echo  🚀 Iniciando servidor local...
echo  🌐 Se abrirá automáticamente en tu navegador: http://localhost:8080
echo.
echo  ═══════════════════════════════════════════════════════════════
echo  ⚠️  IMPORTANTE: NO CIERRES ESTA VENTANA mientras uses el bot
echo  ═══════════════════════════════════════════════════════════════
echo.

python server.py

echo.
echo  🛑 Servidor detenido
pause