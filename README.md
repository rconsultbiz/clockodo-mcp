# Clockodo MCP Plugin

Zeiteinträge in Clockodo per natürlicher Sprache verwalten: anlegen, ändern, löschen und Stoppuhr steuern.

## Installation

### Claude Desktop (MCPB)

1. Lade die `.mcpb`-Datei aus den [GitHub Releases](https://github.com/rconsult/clockodo-mcp/releases) herunter
2. Öffne Claude Desktop und gehe zu **Einstellungen > Integrationen**
3. Ziehe die `.mcpb`-Datei in das Fenster oder klicke auf "Integration hinzufügen"
4. Gib deine Clockodo-Zugangsdaten ein, wenn du dazu aufgefordert wirst:
   - **CLOCKODO_API_USER**: Deine Clockodo E-Mail-Adresse
   - **CLOCKODO_API_KEY**: Dein API-Key (findest du in Clockodo unter **Einstellungen > Persönliche Daten > API**)

### Claude Code (Plugin)

```bash
claude --plugin-dir ./clockodo-mcp
```

### Manuelle Konfiguration

1. Dependencies installieren:

```bash
cd clockodo-mcp/server
npm install
```

2. Credentials konfigurieren:

```bash
cp .env.example server/.env
```

Dann `server/.env` bearbeiten und eigene Clockodo-Zugangsdaten eintragen:

```
CLOCKODO_API_USER=deine-email@firma.com
CLOCKODO_API_KEY=dein-api-key
```

3. Plugin starten:

```bash
npm start
```

## Verfügbare Tools

| Tool | Beschreibung | Typ |
|------|-------------|-----|
| `clockodo_list_entries` | Zeiteinträge auflisten | Lesend |
| `clockodo_create_entry` | Zeiteintrag anlegen | Schreibend |
| `clockodo_edit_entry` | Zeiteintrag ändern | Schreibend |
| `clockodo_delete_entry` | Zeiteintrag löschen | Löschend |
| `clockodo_list_customers` | Kunden auflisten | Lesend |
| `clockodo_list_services` | Leistungen auflisten | Lesend |
| `clockodo_list_projects` | Projekte auflisten | Lesend |
| `clockodo_start_clock` | Stoppuhr starten | Schreibend |
| `clockodo_stop_clock` | Stoppuhr stoppen | Schreibend |
| `clockodo_get_clock` | Laufende Stoppuhr abrufen | Lesend |

## Beispiele

- "Zeige mir meine Zeiteinträge von heute"
- "Erstelle einen Zeiteintrag für [Kunde], 9-12 Uhr, Entwicklung"
- "Starte die Stoppuhr für [Kunde], Beratung"
- "Stoppe die Stoppuhr"
- "Lösche den Zeiteintrag mit ID 12345"

## Credentials

Du benötigst einen Clockodo API-Key. Diesen findest du in Clockodo unter **Einstellungen > Persönliche Daten > API**.

## Entwicklung

```bash
cd server
npm install
npm run build   # TypeScript kompilieren
npm start       # Server starten (mit tsx)
```

### MCPB-Bundle erstellen

```bash
npm run build
npx @anthropic-ai/mcpb pack
```

Die erzeugte `.mcpb`-Datei kann in Claude Desktop installiert werden.
