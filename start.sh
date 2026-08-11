#!/bin/bash
set -e

echo "============================================"
echo "  GW2 Gilden-Build-Tool - Start"
echo "============================================"
echo

if ! command -v node &> /dev/null; then
    echo "[FEHLER] Node.js wurde nicht gefunden."
    echo "Bitte installiere es zuerst von https://nodejs.org"
    exit 1
fi

cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
    echo "Erster Start - installiere Abhängigkeiten..."
    echo "Das kann 30-60 Sekunden dauern."
    echo
    npm install
    echo
fi

echo "Starte die App..."
echo "Sobald 'Local: http://localhost...' erscheint, die Adresse im Browser öffnen."
echo "Zum Beenden: Strg+C drücken."
echo

npm run dev
