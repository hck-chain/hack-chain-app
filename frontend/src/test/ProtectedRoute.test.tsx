/**
 * Tests for src/components/ProtectedRoute.tsx + src/components/ErrorBoundary.tsx
 *
 * Pilar 2: ProtectedRoute — auth redirect, role guard
 * Pilar 4: ErrorBoundary — crash recovery UI
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { ReactNode } from 'react';

// ─── Wrappers ─────────────────────────────────────────────────────────────────

interface WrapperProps {
  children: ReactNode;
  initialPath?: string;
}

/**
 * Full router wrapper with AuthProvider.
 * Also adds a /login route so we can detect redirects.
 */
function RouterWrapper({ children, initialPath = '/protected' }: WrapperProps) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/protected" element={children} />
          <Route path="/protected/:id" element={children} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    render(
      <RouterWrapper>
        <ProtectedRoute>
          <div>Secret Dashboard</div>
        </ProtectedRoute>
      </RouterWrapper>,
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Dashboard')).not.toBeInTheDocument();
  });

  it('renders children when authenticated (no role check)', () => {
    localStorage.setItem('authToken', 'valid-jwt');
    localStorage.setItem('user', JSON.stringify({
      id: 1, email: 'a@b.com', role: 'issuer',
      name: 'Ana', lastName: null, walletAddress: null,
    }));

    render(
      <RouterWrapper>
        <ProtectedRoute>
          <div>Educator Dashboard</div>
        </ProtectedRoute>
      </RouterWrapper>,
    );

    expect(screen.getByText('Educator Dashboard')).toBeInTheDocument();
  });

  it('renders children when user has the required role', () => {
    localStorage.setItem('authToken', 'valid-jwt');
    localStorage.setItem('user', JSON.stringify({
      id: 2, email: 'r@b.com', role: 'recruiter',
      name: 'Bob', lastName: null, walletAddress: null,
    }));

    render(
      <RouterWrapper>
        <ProtectedRoute roles={['recruiter']}>
          <div>Recruiter Dashboard</div>
        </ProtectedRoute>
      </RouterWrapper>,
    );

    expect(screen.getByText('Recruiter Dashboard')).toBeInTheDocument();
  });

  it('redirects to /login when authenticated but wrong role', () => {
    localStorage.setItem('authToken', 'valid-jwt');
    localStorage.setItem('user', JSON.stringify({
      id: 3, email: 's@b.com', role: 'student',
      name: 'Sam', lastName: null, walletAddress: null,
    }));

    render(
      <RouterWrapper>
        <ProtectedRoute roles={['issuer']}>
          <div>Educator Only</div>
        </ProtectedRoute>
      </RouterWrapper>,
    );

    // Wrong role → redirected to /login
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Educator Only')).not.toBeInTheDocument();
  });
});

// ─── ErrorBoundary ────────────────────────────────────────────────────────────

/**
 * Component that always throws on render — used to trigger ErrorBoundary.
 */
function BrokenComponent(): never {
  throw new Error('Render bomb!');
}

describe('ErrorBoundary', () => {
  it('renders children normally when no error', () => {
    render(
      <ErrorBoundary>
        <div>All Good</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('All Good')).toBeInTheDocument();
  });

  it('shows error UI when a child throws', () => {
    // Suppress the expected console.error from ErrorBoundary
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('shows the error message in the details section', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Render bomb!')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
