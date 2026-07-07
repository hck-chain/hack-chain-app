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

function handle401() {
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
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

let _isRefreshing = false;
let _refreshQueue: Array<(ok: boolean) => void> = [];

async function tryRefresh(): Promise<boolean> {
  if (_isRefreshing) {
    return new Promise(resolve => _refreshQueue.push(resolve));
  }
  _isRefreshing = true;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    const ok = res.ok;
    _refreshQueue.forEach(cb => cb(ok));
    _refreshQueue = [];
    return ok;
  } catch {
    _refreshQueue.forEach(cb => cb(false));
    _refreshQueue = [];
    return false;
  } finally {
    _isRefreshing = false;
  }
}

async function withAutoRefresh<T>(fn: () => Promise<Response>): Promise<T> {
  let response = await fn();

  if (response.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      response = await fn();
    } else {
      handle401();
      throw new ApiServiceError('Unauthorized', 401);
    }
  }

  return handleResponse<T>(response);
}

const FETCH_OPTS: RequestInit = { credentials: 'include' };

async function get<T>(path: string): Promise<T> {
  return withAutoRefresh<T>(() => fetch(`${BASE_URL}${path}`, {
    ...FETCH_OPTS,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }));
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  return withAutoRefresh<T>(() => fetch(`${BASE_URL}${path}`, {
    ...FETCH_OPTS,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }));
}

async function getPublic<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...FETCH_OPTS,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<T>(response);
}

async function postPublic<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...FETCH_OPTS,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

async function patch<T>(path: string, body?: unknown): Promise<T> {
  return withAutoRefresh<T>(() => fetch(`${BASE_URL}${path}`, {
    ...FETCH_OPTS,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }));
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
  return withAutoRefresh<T>(() => fetch(`${BASE_URL}${path}`, {
    ...FETCH_OPTS,
    method: 'POST',
    body: formData,
  }));
}

async function uploadPublic<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...FETCH_OPTS,
    method: 'POST',
    body: formData,
  });
  return handleResponse<T>(response);
}

async function del<T>(path: string, body?: unknown): Promise<T> {
  return withAutoRefresh<T>(() => fetch(`${BASE_URL}${path}`, {
    ...FETCH_OPTS,
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }));
}

async function registerProfileShare(issuerId: string): Promise<void> {
  try {
    await post<void>(`/api/issuers/${issuerId}/share`);
  } catch {
    // Silent fail: sharing already happened client-side, the counter is secondary
  }
}

export const api = {
  get,
  post,
  patch,
  del,
  postPublic,
  getPublic,
  upload,
  uploadPublic,
  registerProfileShare,
} as const;
