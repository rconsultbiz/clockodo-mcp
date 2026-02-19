# Clockodo MCP Plugin für Claude Code

Zeiteinträge in Clockodo per natürlicher Sprache verwalten: anlegen, ändern, löschen und Stoppuhr steuern.

## Setup

### 1. Dependencies installieren

```bash
cd clockodo-mcp/server
npm install
```

### 2. Credentials konfigurieren

```bash
cp .env.example server/.env
```

Dann `server/.env` bearbeiten und eigene Clockodo-Zugangsdaten eintragen:

```
CLOCKODO_API_USER=deine-email@firma.com
CLOCKODO_API_KEY=dein-api-key
```

Den API Key findest du in Clockodo unter **Einstellungen > Persönliche Daten > API**.

### 3. Plugin laden

```bash
claude --plugin-dir ./clockodo-mcp
```

Oder als Marketplace installieren (siehe unten).

### 4. Testen

In Claude Code:
- `/mcp` — prüfen ob "clockodo" Server verbunden ist
- "Zeige mir meine Zeiteinträge von heute"
- "Erstelle einen Zeiteintrag für [Kunde], 9-12 Uhr, Entwicklung"
- "Starte die Stoppuhr für [Kunde], Beratung"

## Verfügbare Befehle

| Tool | Beschreibung |
|------|-------------|
| `clockodo_list_entries` | Zeiteinträge auflisten |
| `clockodo_create_entry` | Zeiteintrag anlegen |
| `clockodo_edit_entry` | Zeiteintrag ändern |
| `clockodo_delete_entry` | Zeiteintrag löschen |
| `clockodo_list_customers` | Kunden auflisten |
| `clockodo_list_services` | Leistungen auflisten |
| `clockodo_list_projects` | Projekte auflisten |
| `clockodo_start_clock` | Stoppuhr starten |
| `clockodo_stop_clock` | Stoppuhr stoppen |
| `clockodo_get_clock` | Laufende Stoppuhr abrufen |

## Distribution als Marketplace

Das Plugin in ein eigenes GitHub-Repo pushen. Kollegen können es dann installieren:

```bash
/plugin marketplace add owner/clockodo-mcp
/plugin install clockodo@clockodo-mcp
```

Jeder Kollege muss seine eigene `server/.env` mit seinen Credentials anlegen.
