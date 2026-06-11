import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { appKit } from '@/config/walletConfig';

// WalletConnect/AppKit guardan la sesión en localStorage y se rehidrata sola
// al recargar. Si no la limpiamos en el logout, el modal vuelve a abrir con
// la wallet ya conectada y se hace auto-login.
const WALLET_STORAGE_PREFIXES = [
  'wc@2:',
  '@appkit',
  '@w3m',
  'wagmi.',
  'WALLETCONNECT_',
  'WCM_',
];

function clearWalletStorage(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && WALLET_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (err) {
    console.error('Error clearing wallet storage:', err);
  }
}


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthUser {
  id: number;
  email: string;
  role: string;
  name: string | null;
  lastName: string | null;
  walletAddress: string | null;
  emailVerified?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // 1. Rehidratar desde localStorage al montar el componente
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error rehidratando sesión:", error);
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Función de Login
  const login = useCallback((newUser: AuthUser) => {
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  // 3. Función de Logout
  const logout = useCallback(() => {
    api.post('/api/auth/logout').catch(() => { });
    appKit.disconnect().catch(() => {});
    clearWalletStorage();
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    // Clear admin access cache so the next account doesn't inherit it
    queryClient.removeQueries({ queryKey: ['admin', 'access'] });
    setUser(null);
  }, [queryClient]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
