// Thin fetch wrapper. Requests go to /api/... which vite.config.ts proxies
// to the FastAPI backend in dev; same relative path works unchanged if the
// frontend is ever served from behind the same origin as the API.

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiPost<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, detail || res.statusText);
  }

  return res.json() as Promise<TResponse>;
}

export async function apiGet<TResponse>(path: string): Promise<TResponse> {
  const res = await fetch(`/api${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, detail || res.statusText);
  }

  return res.json() as Promise<TResponse>;
}
