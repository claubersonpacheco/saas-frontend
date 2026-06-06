import { authState, clearSession } from '../stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: HeadersInit = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(authState.accessToken ? { Authorization: `Bearer ${authState.accessToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body:
      options.body instanceof FormData
        ? options.body
        : options.body
          ? JSON.stringify(options.body)
          : undefined,
  });

  if (response.status === 401) {
    clearSession();
  }

  if (!response.ok) {
    const data = await parseResponse(response).catch(() => null);
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message || data?.error || response.statusText;

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return parseResponse(response) as Promise<T>;
}

export const apiUrl = API_URL;
