/**
 * Tests for src/contexts/AuthContext.tsx
 *
 * Pilar 2: AuthProvider + Protected Routes
 * Tests cover:
 * - Initial state (unauthenticated)
 * - localStorage rehydration on mount
 * - login() persists to localStorage and updates state
 * - logout() clears localStorage and resets state
 * - useAuth() throws if used outside AuthProvider
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

// ─── Wrapper ──────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
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
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthContext — initial state', () => {
  it('starts unauthenticated when localStorage is empty', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });
});

describe('AuthContext — localStorage rehydration', () => {
  it('restores session if authToken and user are in localStorage', () => {
    localStorage.setItem('authToken', 'existing-jwt');
    localStorage.setItem('user', JSON.stringify(MOCK_USER));

    const { result } = renderHook(() => useAuth(), { wrapper });

    // After rehydration (isLoading resolves sync in jsdom)
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('existing-jwt');
    expect(result.current.user?.email).toBe('test@hackchain.io');
  });

  it('stays unauthenticated if localStorage data is corrupted', () => {
    localStorage.setItem('authToken', 'some-token');
    localStorage.setItem('user', 'NOT_VALID_JSON{{{');

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});

describe('AuthContext — login()', () => {
  it('sets user and token in state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('new-jwt', MOCK_USER);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.role).toBe('issuer');
    expect(result.current.token).toBe('new-jwt');
  });

  it('persists token and user to localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('new-jwt', MOCK_USER);
    });

    expect(localStorage.getItem('authToken')).toBe('new-jwt');
    expect(JSON.parse(localStorage.getItem('user')!).email).toBe('test@hackchain.io');
  });
});

describe('AuthContext — logout()', () => {
  it('clears state after logout', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => { result.current.login('jwt', MOCK_USER); });
    act(() => { result.current.logout(); });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('removes authToken and user from localStorage after logout', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => { result.current.login('jwt', MOCK_USER); });
    act(() => { result.current.logout(); });

    expect(localStorage.getItem('authToken')).toBeNull();
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
