const BASE_URL = "https://my.clockodo.com/api";

export class ClockodoClient {
  private apiUser: string;
  private apiKey: string;

  constructor() {
    const apiUser = process.env.CLOCKODO_API_USER;
    const apiKey = process.env.CLOCKODO_API_KEY;

    if (!apiUser || !apiKey) {
      throw new Error(
        "CLOCKODO_API_USER und CLOCKODO_API_KEY müssen gesetzt sein. " +
          "Bitte .env Datei im server/ Verzeichnis anlegen (siehe .env.example)."
      );
    }

    this.apiUser = apiUser;
    this.apiKey = apiKey;
  }

  private async request<T>(
    method: string,
    path: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    let url = `${BASE_URL}${path}`;

    const headers: Record<string, string> = {
      "X-ClockodoApiUser": this.apiUser,
      "X-ClockodoApiKey": this.apiKey,
      "X-Clockodo-External-Application": "ClaudeMCP;support@rconsult.biz",
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const init: RequestInit = { method, headers };

    if (method === "GET" && params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      }
      url += `?${searchParams.toString()}`;
    } else if (params && (method === "POST" || method === "PUT")) {
      const body: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          body[key] = value;
        }
      }
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Clockodo API Fehler ${response.status}: ${errorText}`
      );
    }

    return (await response.json()) as T;
  }

  // --- Entries ---

  async getEntries(params: {
    time_since: string;
    time_until: string;
    users_id?: number;
    customers_id?: number;
    projects_id?: number;
    services_id?: number;
  }) {
    return this.request<{ paging: unknown; entries: Entry[] }>(
      "GET",
      "/v2/entries",
      params as Record<string, unknown>
    );
  }

  async createEntry(params: {
    customers_id: number;
    services_id: number;
    billable: number;
    time_since: string;
    time_until: string;
    projects_id?: number;
    text?: string;
    users_id?: number;
  }) {
    return this.request<{ entry: Entry }>("POST", "/v2/entries", params as Record<string, unknown>);
  }

  async editEntry(
    id: number,
    params: {
      customers_id?: number;
      services_id?: number;
      projects_id?: number;
      billable?: number;
      time_since?: string;
      time_until?: string;
      text?: string;
      duration?: number;
    }
  ) {
    return this.request<{ entry: Entry }>(
      "PUT",
      `/v2/entries/${id}`,
      params as Record<string, unknown>
    );
  }

  async deleteEntry(id: number) {
    return this.request<{ success: boolean }>("DELETE", `/v2/entries/${id}`);
  }

  // --- Users ---

  async getUsers() {
    return this.request<{ users: User[] }>("GET", "/v2/users");
  }

  // --- Customers ---

  async getCustomers() {
    return this.request<{ customers: Customer[] }>("GET", "/v2/customers");
  }

  // --- Projects ---

  async getProjects(customersId?: number) {
    const params = customersId ? { customers_id: customersId } : undefined;
    return this.request<{ projects: Project[] }>(
      "GET",
      "/v2/projects",
      params as Record<string, unknown> | undefined
    );
  }

  // --- Services ---

  async getServices() {
    return this.request<{ services: Service[] }>("GET", "/v2/services");
  }

  // --- Clock ---

  async getClock() {
    return this.request<{ running: Entry | null }>("GET", "/v2/clock");
  }

  async startClock(params: {
    customers_id: number;
    services_id: number;
    projects_id?: number;
    billable?: number;
    text?: string;
  }) {
    return this.request<{ running: Entry }>(
      "POST",
      "/v2/clock",
      params as Record<string, unknown>
    );
  }

  async stopClock(id: number) {
    return this.request<{ stopped: Entry; running: Entry | null }>(
      "DELETE",
      `/v2/clock/${id}`
    );
  }
}

// --- Types ---

export interface Entry {
  id: number;
  customers_id: number;
  projects_id: number | null;
  services_id: number;
  users_id: number;
  billable: number;
  text: string | null;
  time_since: string;
  time_until: string | null;
  duration: number | null;
  clocked: boolean;
  customers_name?: string;
  projects_name?: string;
  services_name?: string;
  users_name?: string;
}

export interface User {
  id: number;
  name: string;
  active: boolean;
}

export interface Customer {
  id: number;
  name: string;
  active: boolean;
}

export interface Project {
  id: number;
  name: string;
  customers_id: number;
  active: boolean;
}

export interface Service {
  id: number;
  name: string;
  active: boolean;
}
