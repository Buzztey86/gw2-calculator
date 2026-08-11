# GW2 Gilden-Build-Tool

Lokale Web-App (Vite + React) für Charakter-Builds: Talent-Auswahl (3-Linien-System), Waffenfähigkeiten mit
live aktualisierten Werten je nach Talent-Wahl (Traited Facts), und Ausrüstungs-Stat-Rechner (Crit-Chance,
Crit-Damage, Armor, Health, effektive HP).

Alle Daten (Klassen, Talente, Skills, Bilder) stammen aus der offiziellen Guild Wars 2 API und liegen lokal
in `public/data/` und `public/images/` — die App braucht **keine Internetverbindung** außer für die
Google-Fonts (Cinzel/Inter), die auch weggelassen werden können, falls offline gearbeitet wird.

## Lokal starten

**Einfachster Weg:** Doppelklick auf `start.bat` (Windows) bzw. `start.sh` (Mac/Linux, im Terminal ausführen).
Installiert bei Bedarf automatisch die Abhängigkeiten und startet die App.

**Manuell:**

Voraussetzung: [Node.js](https://nodejs.org) (Version 18 oder neuer).

```bash
npm install
npm run dev
```

Danach im Terminal die angezeigte Adresse öffnen (i. d. R. `http://localhost:5173`).

## Produktions-Build lokal testen

```bash
npm run build
npm run preview
```

Erzeugt einen optimierten Build im Ordner `dist/` und startet einen lokalen Server dafür — so, wie es später
beim Hosting aussehen würde.

## Projektstruktur

```
gw2-buildtool/
├── public/
│   ├── data/            (9× Klassen-JSON + gear.json, effects.json, professions-index.json)
│   └── images/          (alle Skill-/Talent-Icons, lokal, ca. 2.700 Dateien)
├── src/
│   ├── App.jsx           Haupt-Layout (Profession-Auswahl, Tabs)
│   ├── lib/
│   │   ├── build-model.js   3-Linien-Validierung + Traited-Facts-Merge
│   │   └── stats.js         Attribut-/Schadensformeln, Item-Budgets, Stat-Kombinationen
│   ├── hooks/
│   │   └── useGw2Data.js    Lädt/cached die JSON-Dateien per fetch()
│   └── components/
│       ├── ProfessionPicker.jsx
│       ├── TraitLinePicker.jsx
│       ├── WeaponSkillBrowser.jsx
│       └── GearStatsPanel.jsx
└── index.html
```

## Bekannter Umfang (Stand jetzt)

- ✅ Alle 9 Klassen, alle Core- und Elite-Talentlinien, alle Waffenfähigkeiten
- ✅ Live Traited-Facts-Anzeige (Skill-Werte ändern sich mit Talent-Wahl)
- ✅ Ausrüstungs-Stat-Rechner mit 12 Stat-Kombinationen
- ⏳ Speichern/Teilen von Builds (noch nicht umgesetzt)
- ⏳ Utility-Skills, Relics/Runen/Sigille/Infusionen sind als Daten vorhanden (`public/data/gear.json`,
  `effects.json`), aber noch nicht in der UI verdrahtet
- ⚠️ Bei einigen Nischen-Attributen (Accessory-/Rückenitem-Budget) sind die Werte angenommen, nicht einzeln
  API-verifiziert (siehe Kommentare in `src/lib/stats.js`)

## Hosting (nächster Schritt)

Das ist eine reine Client-Anwendung (kein Backend, keine Datenbank) — lässt sich 1:1 auf jedem
Static-Hosting-Anbieter deployen. Empfehlenswert, alle mit kostenlosem Tier:

- **Netlify** — Ordner per Drag & Drop auf [app.netlify.com/drop](https://app.netlify.com/drop) ziehen (den
  `dist/`-Ordner nach `npm run build`), fertig. Kein Account nötig für einen ersten Test.
- **Vercel** — `npx vercel` im Projektordner ausführen, folgt den Prompts (erkennt Vite automatisch).
- **GitHub Pages** — Projekt in ein GitHub-Repo pushen, `vite.config.js` um `base: '/<repo-name>/'` ergänzen,
  dann `npm run build` + den `dist/`-Inhalt auf den `gh-pages`-Branch pushen (oder eine GitHub-Action dafür
  einrichten).
- **Cloudflare Pages** — Repo verbinden, Build-Command `npm run build`, Output-Verzeichnis `dist`.

Bei allen vier reicht es aus, dass sie `npm run build` ausführen und den `dist/`-Ordner ausliefern — es gibt
keine Server-Logik, die separat gehostet werden müsste.
