/**
 * Tests for src/contexts/AuthContext.tsx
 *
 * Pilar 2: AuthProvider + Protected Routes
 * Tests cover:
 * - Initial state (unauthenticated)
 * - localStorage rehydration on mount (auth itself is an httpOnly cookie —
 *   only the non-sensitive user object is cached client-side, in
 *   localStorage, not sessionStorage)
 * - login() persists the user to localStorage and updates state
 * - logout() clears the cached user and resets state
 * - useAuth() throws if used outside AuthProvider
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

vi.mock('@/config/walletConfig', () => ({
  appKit: {
    disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/services/api', () => ({
  api: {
    post: vi.fn().mockResolvedValue({}),
  },
}));

// ─── Wrapper ──────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const MOCK_USER = {
  id: 1,
  email: 'test@hackchain.io',
  role: 'issuer',
  name: 'Carlos',
  lastName: 'Méndez',
  walletAddress: '0xABC',
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthContext — initial state', () => {
  it('starts unauthenticated when localStorage is empty', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

describe('AuthContext — localStorage rehydration', () => {
  it('restores session if a user is cached in localStorage', async () => {
    localStorage.setItem('user', JSON.stringify(MOCK_USER));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('test@hackchain.io');
  });

  it('stays unauthenticated and clears the key if localStorage data is corrupted', async () => {
    localStorage.setItem('user', 'NOT_VALID_JSON{{{');

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('user')).toBeNull();
  });
});

describe('AuthContext — login()', () => {
  it('sets the user in state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.login(MOCK_USER);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.role).toBe('issuer');
  });

  it('persists the user to localStorage, stripping email (PII stays in memory only)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.login(MOCK_USER);
    });

    const stored = JSON.parse(localStorage.getItem('user')!);
    expect(stored.email).toBeUndefined();
    expect(stored.role).toBe('issuer');
  });
});

describe('AuthContext — logout()', () => {
  it('clears state after logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => { result.current.login(MOCK_USER); });
    act(() => { result.current.logout(); });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('removes the cached user from localStorage after logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => { result.current.login(MOCK_USER); });
    act(() => { result.current.logout(); });

    expect(localStorage.getItem('user')).toBeNull();
  });
});

describe('useAuth() — error guard', () => {
  it('throws if used outside AuthProvider', () => {
    // Suppress React error boundary noise in test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider',
    );
    consoleSpy.mockRestore();
  });
});
