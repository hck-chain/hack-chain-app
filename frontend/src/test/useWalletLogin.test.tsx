import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

vi.mock('@/config/walletConfig', () => ({
    appKit: {
        getAddress: vi.fn(),
        open: vi.fn(),
        subscribeAccount: vi.fn(),
        subscribeEvents: vi.fn(),
    },
}));

vi.mock('@/services/api', () => ({
    api: { postPublic: vi.fn() },
    ApiServiceError: class ApiServiceError extends Error {
        status: number;
        constructor(message: string, status: number) {
            super(message);
            this.name = 'ApiServiceError';
            this.status = status;
        }
    },
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ login: vi.fn() }),
}));

import { appKit } from '@/config/walletConfig';
import { api, ApiServiceError } from '@/services/api';
import { useWalletLogin } from '@/hooks/useWalletLogin';

const MOCK_WALLET = '0xabc123def456abc123def456abc123def456abc1';

const createWrapper = () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client }, children);
};

const simulateWalletConnect = (address = MOCK_WALLET) => {
    vi.mocked(appKit.getAddress).mockReturnValue(undefined);
    vi.mocked(appKit.open).mockResolvedValue(undefined);
    vi.mocked(appKit.subscribeAccount).mockImplementation((cb: any) => {
        setTimeout(() => cb({ address }), 0);
        return vi.fn();
    });
    vi.mocked(appKit.subscribeEvents).mockReturnValue(vi.fn());
};

const simulateModalClose = () => {
    vi.mocked(appKit.getAddress).mockReturnValue(undefined);
    vi.mocked(appKit.open).mockResolvedValue(undefined);
    vi.mocked(appKit.subscribeAccount).mockImplementation(() => vi.fn());
    vi.mocked(appKit.subscribeEvents).mockImplementation((cb: any) => {
        setTimeout(() => cb({ data: { event: 'MODAL_CLOSE' } }), 0);
        return vi.fn();
    });
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useWalletLogin', () => {
    it('returns isWalletNotFound=false and no error on initial state', () => {
        const { result } = renderHook(() => useWalletLogin(), {
            wrapper: createWrapper(),
        });

        expect(result.current.isWalletNotFound).toBe(false);
        expect(result.current.error).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });

    it('sets isWalletNotFound=true when API returns 404', async () => {
        simulateWalletConnect();
        vi.mocked(api.postPublic).mockRejectedValue(
            new ApiServiceError('No user associated with this wallet', 404)
        );

        const { result } = renderHook(() => useWalletLogin(), {
            wrapper: createWrapper(),
        });

        act(() => { result.current.connectAndLogin(); });

        await waitFor(() => {
            expect(result.current.isWalletNotFound).toBe(true);
        });

        expect(result.current.error).toBe('No user associated with this wallet');
    });

    it('sets isWalletNotFound=false for generic API errors', async () => {
        simulateWalletConnect();
        vi.mocked(api.postPublic).mockRejectedValue(
            new ApiServiceError('Internal server error', 500)
        );

        const { result } = renderHook(() => useWalletLogin(), {
            wrapper: createWrapper(),
        });

        act(() => { result.current.connectAndLogin(); });

        await waitFor(() => {
            expect(result.current.error).toBeTruthy();
        });

        expect(result.current.isWalletNotFound).toBe(false);
    });

    it('clears isWalletNotFound on retry', async () => {
        simulateWalletConnect();
        vi.mocked(api.postPublic).mockRejectedValue(
            new ApiServiceError('No user associated with this wallet', 404)
        );

        const { result } = renderHook(() => useWalletLogin(), {
            wrapper: createWrapper(),
        });

        act(() => { result.current.connectAndLogin(); });
        await waitFor(() => expect(result.current.isWalletNotFound).toBe(true));

        // Retry: modal closes without connecting
        simulateModalClose();
        act(() => { result.current.connectAndLogin(); });

        await waitFor(() => {
            expect(result.current.isWalletNotFound).toBe(false);
        });
    });

    it('sets error when user closes modal without connecting', async () => {
        simulateModalClose();

        const { result } = renderHook(() => useWalletLogin(), {
            wrapper: createWrapper(),
        });

        act(() => { result.current.connectAndLogin(); });

        await waitFor(() => {
            expect(result.current.error).toBe('No wallet connected');
            expect(result.current.isWalletNotFound).toBe(false);
        });
    });
});
