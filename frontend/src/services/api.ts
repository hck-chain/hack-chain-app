const BASE_URL = import.meta.env.VITE_API_URL;

export class ApiServiceError extends Error {
  constructor(
    public message: string,
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
  const token = sessionStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handle401() {
  // Clear session data only — AppKit state lives in localStorage and is
  // handled separately by the Login page on mount.
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('user');

  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    handle401();
    throw new ApiServiceError('Unauthorized', 401);
  }

  // Si la respuesta es 204 (No Content), no intentamos parsear JSON
  if (response.status === 204) return {} as T;

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

async function patch<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });
  return handleResponse<T>(response);
}

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
  patch,
  postPublic,
  upload,
  uploadPublic,
} as const;