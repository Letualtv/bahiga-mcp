export class NinjaClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
  }

  private headers(): Record<string, string> {
    return {
      'X-Api-Token': this.token,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/v1${path}`;
    const res = await fetch(url, { ...options, headers: this.headers() });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Invoice Ninja API ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export function createNinjaClient(): NinjaClient {
  const url = process.env.INVOICE_NINJA_URL;
  const token = process.env.INVOICE_NINJA_TOKEN;
  if (!url || !token) throw new Error('INVOICE_NINJA_URL e INVOICE_NINJA_TOKEN son obligatorios');
  return new NinjaClient(url, token);
}
