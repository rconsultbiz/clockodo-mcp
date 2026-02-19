import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { config } from "dotenv";

// Load .env from server directory (or plugin root)
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });
config({ path: resolve(__dirname, "../../.env") });

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ClockodoClient } from "./clockodo-client.js";

const client = new ClockodoClient();

const server = new McpServer({
  name: "clockodo",
  version: "1.0.0",
});

// Helper: format duration in seconds to HH:MM
function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, "0")}min`;
}

// Helper: format ISO date to readable format
function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Helper: convert local date + time strings to ISO UTC
function toIsoUtc(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

// Helper: get today as YYYY-MM-DD
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ========== TOOL: List Entries ==========
server.tool(
  "clockodo_list_entries",
  "Zeiteinträge auflisten. Zeigt alle Zeiteinträge für einen Zeitraum an. Standardmäßig werden die Einträge von heute angezeigt.",
  {
    date_from: z
      .string()
      .optional()
      .describe("Startdatum im Format YYYY-MM-DD (Standard: heute)"),
    date_to: z
      .string()
      .optional()
      .describe("Enddatum im Format YYYY-MM-DD (Standard: heute)"),
  },
  async ({ date_from, date_to }) => {
    const from = date_from || today();
    const to = date_to || today();
    const result = await client.getEntries({
      time_since: `${from} 00:00:00`,
      time_until: `${to} 23:59:59`,
    });

    if (result.entries.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Keine Zeiteinträge gefunden für ${from} bis ${to}.`,
          },
        ],
      };
    }

    const lines = result.entries.map((e) => {
      const von = formatDateTime(e.time_since);
      const bis = formatDateTime(e.time_until);
      const dauer = formatDuration(e.duration);
      return (
        `ID: ${e.id} | ${von} - ${bis} | ${dauer}\n` +
        `  Kunde: ${e.customers_name || e.customers_id} | ` +
        `Projekt: ${e.projects_name || e.projects_id || "-"} | ` +
        `Leistung: ${e.services_name || e.services_id}\n` +
        `  Text: ${e.text || "-"} | Abrechenbar: ${e.billable === 1 ? "Ja" : e.billable === 2 ? "Abgerechnet" : "Nein"}`
      );
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Zeiteinträge (${from} bis ${to}):\n\n${lines.join("\n\n")}`,
        },
      ],
    };
  }
);

// ========== TOOL: Create Entry ==========
server.tool(
  "clockodo_create_entry",
  "Neuen Zeiteintrag anlegen. Erstellt einen Zeiteintrag mit Kunde, Leistung, Datum und Uhrzeiten.",
  {
    customers_id: z.number().describe("ID des Kunden"),
    services_id: z.number().describe("ID der Leistung/Service"),
    date: z
      .string()
      .describe("Datum im Format YYYY-MM-DD"),
    time_from: z
      .string()
      .describe("Startzeit im Format HH:MM (z.B. 09:00)"),
    time_until: z
      .string()
      .describe("Endzeit im Format HH:MM (z.B. 17:00)"),
    projects_id: z.number().optional().describe("ID des Projekts (optional)"),
    text: z
      .string()
      .optional()
      .describe("Beschreibung/Kommentar (optional)"),
    billable: z
      .boolean()
      .optional()
      .describe("Abrechenbar? (Standard: true)"),
  },
  async ({
    customers_id,
    services_id,
    date,
    time_from,
    time_until,
    projects_id,
    text,
    billable,
  }) => {
    const result = await client.createEntry({
      customers_id,
      services_id,
      billable: billable === false ? 0 : 1,
      time_since: toIsoUtc(date, time_from),
      time_until: toIsoUtc(date, time_until),
      projects_id,
      text,
    });

    const e = result.entry;
    return {
      content: [
        {
          type: "text" as const,
          text:
            `Zeiteintrag erstellt (ID: ${e.id}):\n` +
            `  Datum: ${date} | ${time_from} - ${time_until}\n` +
            `  Kunde: ${e.customers_name || e.customers_id}\n` +
            `  Leistung: ${e.services_name || e.services_id}\n` +
            `  Text: ${e.text || "-"}`,
        },
      ],
    };
  }
);

// ========== TOOL: Edit Entry ==========
server.tool(
  "clockodo_edit_entry",
  "Bestehenden Zeiteintrag bearbeiten. Nur die angegebenen Felder werden geändert.",
  {
    entry_id: z.number().describe("ID des Zeiteintrags"),
    customers_id: z.number().optional().describe("Neue Kunden-ID"),
    services_id: z.number().optional().describe("Neue Leistungs-ID"),
    projects_id: z.number().optional().describe("Neue Projekt-ID"),
    date: z.string().optional().describe("Neues Datum (YYYY-MM-DD)"),
    time_from: z.string().optional().describe("Neue Startzeit (HH:MM)"),
    time_until: z.string().optional().describe("Neue Endzeit (HH:MM)"),
    text: z.string().optional().describe("Neuer Kommentar/Beschreibung"),
    billable: z.boolean().optional().describe("Abrechenbar?"),
  },
  async ({
    entry_id,
    customers_id,
    services_id,
    projects_id,
    date,
    time_from,
    time_until,
    text,
    billable,
  }) => {
    const params: Record<string, unknown> = {};
    if (customers_id !== undefined) params.customers_id = customers_id;
    if (services_id !== undefined) params.services_id = services_id;
    if (projects_id !== undefined) params.projects_id = projects_id;
    if (text !== undefined) params.text = text;
    if (billable !== undefined) params.billable = billable ? 1 : 0;
    if (date && time_from) params.time_since = toIsoUtc(date, time_from);
    if (date && time_until) params.time_until = toIsoUtc(date, time_until);

    const result = await client.editEntry(entry_id, params);
    const e = result.entry;
    return {
      content: [
        {
          type: "text" as const,
          text:
            `Zeiteintrag ${e.id} aktualisiert:\n` +
            `  ${formatDateTime(e.time_since)} - ${formatDateTime(e.time_until)}\n` +
            `  Kunde: ${e.customers_name || e.customers_id}\n` +
            `  Text: ${e.text || "-"}`,
        },
      ],
    };
  }
);

// ========== TOOL: Delete Entry ==========
server.tool(
  "clockodo_delete_entry",
  "Zeiteintrag löschen. Löscht den Zeiteintrag mit der angegebenen ID unwiderruflich.",
  {
    entry_id: z.number().describe("ID des zu löschenden Zeiteintrags"),
  },
  async ({ entry_id }) => {
    await client.deleteEntry(entry_id);
    return {
      content: [
        {
          type: "text" as const,
          text: `Zeiteintrag ${entry_id} wurde gelöscht.`,
        },
      ],
    };
  }
);

// ========== TOOL: List Customers ==========
server.tool(
  "clockodo_list_customers",
  "Alle Kunden auflisten. Gibt ID und Name aller aktiven Kunden zurück. Nutze dieses Tool um die richtige Kunden-ID für andere Aktionen zu finden.",
  {},
  async () => {
    const result = await client.getCustomers();
    const active = result.customers.filter((c) => c.active);
    const lines = active.map((c) => `  ${c.id}: ${c.name}`);
    return {
      content: [
        {
          type: "text" as const,
          text: `Kunden (${active.length}):\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

// ========== TOOL: List Services ==========
server.tool(
  "clockodo_list_services",
  "Alle Leistungen/Services auflisten. Gibt ID und Name aller aktiven Leistungen zurück. Nutze dieses Tool um die richtige Service-ID für andere Aktionen zu finden.",
  {},
  async () => {
    const result = await client.getServices();
    const active = result.services.filter((s) => s.active);
    const lines = active.map((s) => `  ${s.id}: ${s.name}`);
    return {
      content: [
        {
          type: "text" as const,
          text: `Leistungen (${active.length}):\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

// ========== TOOL: List Projects ==========
server.tool(
  "clockodo_list_projects",
  "Projekte auflisten. Gibt ID und Name aller aktiven Projekte zurück. Optional nach Kunde filtern.",
  {
    customer_id: z
      .number()
      .optional()
      .describe("Kunden-ID zum Filtern (optional)"),
  },
  async ({ customer_id }) => {
    const result = await client.getProjects(customer_id);
    const active = result.projects.filter((p) => p.active);
    const lines = active.map(
      (p) => `  ${p.id}: ${p.name} (Kunde: ${p.customers_id})`
    );
    return {
      content: [
        {
          type: "text" as const,
          text:
            active.length > 0
              ? `Projekte (${active.length}):\n${lines.join("\n")}`
              : "Keine aktiven Projekte gefunden.",
        },
      ],
    };
  }
);

// ========== TOOL: Get Clock ==========
server.tool(
  "clockodo_get_clock",
  "Laufende Stoppuhr abrufen. Zeigt an, ob gerade eine Zeiterfassung per Stoppuhr läuft und welche.",
  {},
  async () => {
    const result = await client.getClock();
    if (!result.running) {
      return {
        content: [
          { type: "text" as const, text: "Keine Stoppuhr läuft gerade." },
        ],
      };
    }
    const e = result.running;
    return {
      content: [
        {
          type: "text" as const,
          text:
            `Laufende Stoppuhr (ID: ${e.id}):\n` +
            `  Gestartet: ${formatDateTime(e.time_since)}\n` +
            `  Kunde: ${e.customers_name || e.customers_id}\n` +
            `  Leistung: ${e.services_name || e.services_id}\n` +
            `  Text: ${e.text || "-"}`,
        },
      ],
    };
  }
);

// ========== TOOL: Start Clock ==========
server.tool(
  "clockodo_start_clock",
  "Stoppuhr starten. Beginnt eine neue Zeiterfassung per Stoppuhr für den angegebenen Kunden und Leistung.",
  {
    customers_id: z.number().describe("ID des Kunden"),
    services_id: z.number().describe("ID der Leistung/Service"),
    projects_id: z.number().optional().describe("ID des Projekts (optional)"),
    text: z.string().optional().describe("Beschreibung/Kommentar (optional)"),
    billable: z
      .boolean()
      .optional()
      .describe("Abrechenbar? (Standard: true)"),
  },
  async ({ customers_id, services_id, projects_id, text, billable }) => {
    const result = await client.startClock({
      customers_id,
      services_id,
      projects_id,
      billable: billable === false ? 0 : 1,
      text,
    });
    const e = result.running;
    return {
      content: [
        {
          type: "text" as const,
          text:
            `Stoppuhr gestartet (ID: ${e.id}):\n` +
            `  Kunde: ${e.customers_name || e.customers_id}\n` +
            `  Leistung: ${e.services_name || e.services_id}\n` +
            `  Text: ${e.text || "-"}`,
        },
      ],
    };
  }
);

// ========== TOOL: Stop Clock ==========
server.tool(
  "clockodo_stop_clock",
  "Stoppuhr stoppen. Beendet die laufende Zeiterfassung. Die Entry-ID bekommst du über clockodo_get_clock.",
  {
    entry_id: z.number().describe("ID des laufenden Eintrags (aus clockodo_get_clock)"),
  },
  async ({ entry_id }) => {
    const result = await client.stopClock(entry_id);
    const e = result.stopped;
    return {
      content: [
        {
          type: "text" as const,
          text:
            `Stoppuhr gestoppt (ID: ${e.id}):\n` +
            `  ${formatDateTime(e.time_since)} - ${formatDateTime(e.time_until)}\n` +
            `  Dauer: ${formatDuration(e.duration)}\n` +
            `  Kunde: ${e.customers_name || e.customers_id}\n` +
            `  Text: ${e.text || "-"}`,
        },
      ],
    };
  }
);

// ========== Start Server ==========
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Clockodo MCP Server Fehler:", err);
  process.exit(1);
});
