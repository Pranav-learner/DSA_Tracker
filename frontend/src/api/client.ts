import { env } from '@/config/env';
import type { ApiEnvelope } from '@/types';

/** Error thrown by the API client, carrying the HTTP status. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface BackendError {
  success: false;
  error: { message: string; statusCode: number; details?: unknown };
}

/**
 * Thin fetch wrapper that unwraps the `{ success, data }` envelope and turns
 * error responses into a typed `ApiError`. Server state is otherwise owned by
 * React Query.
 */
export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}${path}`, {
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (cause) {
    throw new ApiError(0, 'Network error — is the API server running?', cause);
  }

  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | BackendError | null;

  if (!res.ok || !body || body.success === false) {
    const message =
      body && body.success === false ? body.error.message : `Request failed (${res.status})`;
    const details = body && body.success === false ? body.error.details : undefined;
    throw new ApiError(res.status, message, details);
  }

  return body.data;
}
