/**
 * Centralized API client for HackChain frontend.
 *
 * - Single source for base URL (`VITE_API_URL`)
 * - Auto-injects `Authorization: Bearer` header from localStorage
 * - Typed error handling with `ApiServiceError`
 * - 401 responses automatically clear auth and redirect to /login
 */

const BASE_URL = import.meta.env.VITE_API_URL;

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export class ApiServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiServiceError';
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handle401() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  // Only redirect if we're not already on the login page
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    handle401();
    throw new ApiServiceError('Unauthorized', 401);
  }

  const data = await response.json();

  if (!response.ok) {
    const message =
      (data as { error?: string }).error ??
      (data as { errors?: { msg: string }[] }).errors?.[0]?.msg ??
      `Request failed with status ${response.status}`;
    throw new ApiServiceError(message, response.status, data);
  }

  return data as T;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * GET request with auth headers.
 */
async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  return handleResponse<T>(response);
}

/**
 * POST request with JSON body and auth headers.
 */
async function post<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

/**
 * POST request without auth headers (for public endpoints like login/register).
 */
async function postPublic<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

/**
 * Upload a file via FormData with auth headers.
 */
async function upload<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      // No Content-Type header — browser sets it with boundary for FormData
      ...getAuthHeaders(),
    },
    body: formData,
  });
  return handleResponse<T>(response);
}

/**
 * Upload a file via FormData WITHOUT auth headers (for public upload endpoints).
 */
async function uploadPublic<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<T>(response);
}

export const api = {
  get,
  post,
  postPublic,
  upload,
  uploadPublic,
} as const;
