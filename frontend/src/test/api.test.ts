/**
 * Tests for src/services/api.ts
 *
 * Pilar 1: API Service Layer
 * Tests cover:
 * - GET / POST / postPublic method signatures
 * - Auth header injection from localStorage
 * - 401 handling (clears localStorage)
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
  localStorage.clear();
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

  it('injects Authorization header when authToken is in localStorage', async () => {
    localStorage.setItem('authToken', 'test-token-123');
    mockFetch(200, {});
    await api.get('/api/auth/me');

    const headers = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(headers['Authorization']).toBe('Bearer test-token-123');
  });

  it('does NOT inject Authorization header when no token', async () => {
    mockFetch(200, {});
    await api.get('/api/auth/me');

    const headers = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(headers['Authorization']).toBeUndefined();
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

  it('clears localStorage and redirects on 401', async () => {
    localStorage.setItem('authToken', 'expired-token');
    localStorage.setItem('user', '{"id":1}');
    mockFetch(401, {});

    await expect(api.get('/api/auth/me')).rejects.toMatchObject({ status: 401 });

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
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

  it('injects auth header on authenticated post', async () => {
    localStorage.setItem('authToken', 'my-jwt');
    mockFetch(200, {});
    await api.post('/api/certificates/database', { title: 'Test' });

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers['Authorization']).toBe('Bearer my-jwt');
  });
});

// ─── api.postPublic ───────────────────────────────────────────────────────────

describe('api.postPublic', () => {
  it('does NOT include Authorization header even if token exists', async () => {
    localStorage.setItem('authToken', 'secret');
    mockFetch(200, { token: 'new-jwt' });

    await api.postPublic('/api/auth/login', { email: 'a@b.com', password: '123' });

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers['Authorization']).toBeUndefined();
    expect(options.headers['Content-Type']).toBe('application/json');
  });
});
