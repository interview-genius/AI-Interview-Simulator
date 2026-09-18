import { supabase } from './supabase';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    if (session?.user?.email) {
      headers['X-User-Email'] = session.user.email;
    }
  } catch (err) {
    // Supabase auth not configured or error fetching session
  }

  // Fallback to local session storage if Supabase session is not active
  if (!headers['Authorization']) {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const email = localStorage.getItem('auth_email') || sessionStorage.getItem('auth_email');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (email) {
      headers['X-User-Email'] = email;
    }
  }

  return headers;
}


export async function apiPost<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, detail || res.statusText);
  }

  return res.json() as Promise<TResponse>;
}

export async function apiGet<TResponse>(path: string): Promise<TResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api${path}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, detail || res.statusText);
  }

  return res.json() as Promise<TResponse>;
}

