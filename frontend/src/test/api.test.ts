/**
 * Tests for src/services/api.ts
 *
 * Pilar 1: API Service Layer
 * Tests cover:
 * - GET / POST / postPublic method signatures
 * - credentials: 'include' on every request (auth is via httpOnly cookies,
 *   not a client-readable token — there is no Authorization header)
 * - 401 handling (clears cached user, redirects to /login)
 * - Error extraction from backend response shape
 * - ApiServiceError type
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiServiceError } from '@/services/api';

// ─── Helpers ────────────────────────────────────────────────────────────────

function mockFetch(status: number, body: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as Response);
}

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
  // Reset location so 401 redirect tests work
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { pathname: '/dashboard', href: '' },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── ApiServiceError ─────────────────────────────────────────────────────────

describe('ApiServiceError', () => {
  it('should store status and data', () => {
    const err = new ApiServiceError('Oops', 422, { field: 'email' });
    expect(err.status).toBe(422);
    expect(err.data).toEqual({ field: 'email' });
    expect(err.name).toBe('ApiServiceError');
    expect(err.message).toBe('Oops');
  });
});

// ─── api.get ─────────────────────────────────────────────────────────────────

describe('api.get', () => {
  it('returns parsed JSON on 200', async () => {
    mockFetch(200, { user: { id: 1 } });
    const result = await api.get<{ user: { id: number } }>('/api/auth/me');
    expect(result.user.id).toBe(1);
  });

  it('sends credentials: include so the httpOnly auth cookie is attached', async () => {
    mockFetch(200, {});
    await api.get('/api/auth/me');

    const options = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(options.credentials).toBe('include');
    expect(options.headers['Authorization']).toBeUndefined();
  });

  it('throws ApiServiceError with extracted error message on non-ok', async () => {
    mockFetch(422, { error: 'Email already exists' });
    await expect(api.get('/api/auth/me')).rejects.toMatchObject({
      status: 422,
      message: 'Email already exists',
    });
  });

  it('throws ApiServiceError with first validation message when errors array', async () => {
    mockFetch(400, { errors: [{ msg: 'Name is required' }, { msg: 'Email invalid' }] });
    await expect(api.get('/api/test')).rejects.toMatchObject({
      status: 400,
      message: 'Name is required',
    });
  });

  it('clears the cached user and redirects on 401 (after a failed refresh)', async () => {
    localStorage.setItem('user', '{"id":1}');
    sessionStorage.setItem('user', '{"id":1}');
    // Every fetch call — the original request AND the refresh attempt it
    // triggers — returns 401, so withAutoRefresh gives up and logs out.
    mockFetch(401, {});

    await expect(api.get('/api/auth/me')).rejects.toMatchObject({ status: 401 });

    expect(localStorage.getItem('user')).toBeNull();
    expect(sessionStorage.getItem('user')).toBeNull();
    expect(window.location.href).toBe('/login');
  });
});

// ─── api.post ─────────────────────────────────────────────────────────────────

describe('api.post', () => {
  it('sends body as JSON string', async () => {
    mockFetch(200, { ok: true });
    await api.post('/api/test', { name: 'HackChain' });

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.body).toBe(JSON.stringify({ name: 'HackChain' }));
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('sends credentials: include on POST too', async () => {
    mockFetch(200, {});
    await api.post('/api/certificates/database', { title: 'Test' });

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.credentials).toBe('include');
  });
});

// ─── api.postPublic ───────────────────────────────────────────────────────────

describe('api.postPublic', () => {
  it('does NOT include Authorization header even if token exists', async () => {
    sessionStorage.setItem('authToken', 'secret');
    mockFetch(200, { token: 'new-jwt' });

    await api.postPublic('/api/auth/login', { email: 'a@b.com', password: '123' });

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers['Authorization']).toBeUndefined();
    expect(options.headers['Content-Type']).toBe('application/json');
  });
});
