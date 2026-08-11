@echo off
setlocal

echo ============================================
echo   GW2 Gilden-Build-Tool - Start
echo ============================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [FEHLER] Node.js wurde nicht gefunden.
    echo Bitte installiere es zuerst von https://nodejs.org
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Erster Start - installiere Abhaengigkeiten...
    echo Das kann 30-60 Sekunden dauern.
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [FEHLER] npm install ist fehlgeschlagen.
        pause
        exit /b 1
    )
    echo.
)

echo Starte die App...
echo Sobald "Local: http://localhost..." erscheint, die Adresse im Browser oeffnen.
echo Zum Beenden: dieses Fenster schliessen oder Strg+C druecken.
echo.

call npm run dev

pause
