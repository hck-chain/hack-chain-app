import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

vi.mock('@/config/walletConfig', () => ({
    appKit: {
        getAddress: vi.fn(),
        open: vi.fn(),
        disconnect: vi.fn().mockResolvedValue(undefined),
        subscribeAccount: vi.fn(),
        subscribeEvents: vi.fn(),
        getProvider: vi.fn(),
    },
}));

const mockSignMessage = vi.fn();
vi.mock('ethers', () => {
    class Web3Provider {
        constructor(_provider: unknown) {}
        getSigner() {
            return { signMessage: mockSignMessage };
        }
    }
    return {
        ethers: {
            providers: { Web3Provider },
        },
    };
});

vi.mock('@/services/api', () => ({
    api: {
        postPublic: vi.fn(),
        get: vi.fn(),
    },
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

const MOCK_WALLET = '0xABC123def456abc123def456abc123def456ABC1';
const MOCK_WALLET_LC = MOCK_WALLET.toLowerCase();
const MOCK_NONCE = 'deadbeef';
const MOCK_SIGNATURE = '0x' + 'a'.repeat(130);

const createWrapper = () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client }, children);
};

const simulateConnectSuccess = (address = MOCK_WALLET) => {
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
    vi.mocked(appKit.getProvider).mockReturnValue({} as any);
    vi.mocked(api.get).mockResolvedValue({ nonce: MOCK_NONCE } as any);
    mockSignMessage.mockResolvedValue(MOCK_SIGNATURE);
});

describe('useWalletLogin — initial state', () => {
    it('starts in idle phase with no errors', () => {
        const { result } = renderHook(() => useWalletLogin(), {
            wrapper: createWrapper(),
        });

        expect(result.current.walletAddress).toBeNull();
        expect(result.current.isConnecting).toBe(false);
        expect(result.current.isAwaitingSignature).toBe(false);
        expect(result.current.isSigning).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isWalletNotFound).toBe(false);
        expect(result.current.error).toBeUndefined();
    });
});

describe('useWalletLogin — connect phase', () => {
    it('connects and exposes the wallet address (lowercased)', async () => {
        simulateConnectSuccess();

        const { result } = renderHook(() => useWalletLogin(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            await result.current.connect();
        });

        expect(result.current.walletAddress).toBe(MOCK_WALLET_LC);
        expect(result.current.isAwaitingSignature).toBe(true);
        // Critical: signMessage MUST NOT have been called by connect alone.
        // That's the whole point of the iOS fix — signing happens in a fresh
        // user gesture, not chained off connect.
        expect(mockSignMessage).not.toHaveBeenCalled();
        expect(api.postPublic).not.toHaveBeenCalled();
    });

    it('sets error and resets to idle when user closes modal without connecting', async () => {
        simulateModalClose();

        const { result } = renderHook(() => useWalletLogin(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            await result.current.connect();
        });

        await waitFor(() => {
            expect(result.current.error).toBe('No wallet connected');
        });
        expect(result.current.walletAddress).toBeNull();
        expect(result.current.isAwaitingSignature).toBe(false);
    });
});

describe('useWalletLogin — signAndLogin phase', () => {
    it('fetches nonce, signs the message and calls login API', async () => {
        simulateConnectSuccess();
        vi.mocked(api.postPublic).mockResolvedValue({
            message: 'Authenticated',
            user: { id: 1, email: 'a@b.c', role: 'student', wallet_address: MOCK_WALLET_LC },
        } as any);

        const { result } = renderHook(() => useWalletLogin(), {
            wrapper: createWrapper(),
        });

        await act(async () => { await result.current.connect(); });
        await act(async () => { await result.current.signAndLogin(); });

        await waitFor(() => {
            expect(api.postPublic).toHaveBeenCalledWith('/api/auth/login', {
                wallet_address: MOCK_WALLET_LC,
                signature: MOCK_SIGNATURE,
            });
        });

        expect(api.get).toHaveBeenCalledWith(`/api/users/${MOCK_WALLET_LC}/nonce`);
        expect(mockSignMessage).toHaveBeenCalledTimes(1);
        const signedMessage = mockSignMessage.mock.calls[0][0] as string;
        expect(signedMessage).toContain(MOCK_WALLET_LC);
        expect(signedMessage).toContain(MOCK_NONCE);
    });

    it('refuses to sign if not connected first', async () => {
        const { result } = renderHook(() => useWalletLogin(), {
            wrapper: createWrapper(),
        });

        await act(async () => { await result.current.signAndLogin(); });

        expect(result.current.error).toBe('Connect your wallet first');
        expect(mockSignMessage).not.toHaveBeenCalled();
        expect(api.postPublic).not.toHaveBeenCalled();
    });

    it('surfaces signing errors and stays in awaiting-signature so user can retry', async () => {
        simulateConnectSuccess();
        mockSignMessage.mockRejectedValue(new Error('User rejected the request'));

        const { result } = renderHook(() => useWalletLogin(), {
            wrapper: createWrapper(),
        });

        await act(async () => { await result.current.connect(); });
        await act(async () => { await result.current.signAndLogin(); });

        await waitFor(() => {
            expect(result.current.error).toBe('User rejected the request');
        });
        expect(result.current.isAwaitingSignature).toBe(true);
        expect(api.postPublic).not.toHaveBeenCalled();
    });

    it('sets isWalletNotFound=true on 404 from /api/auth/login', async () => {
        simulateConnectSuccess();
        vi.mocked(api.postPublic).mockRejectedValue(
            new ApiServiceError('No user associated with this wallet', 404)
        );

        const { result } = renderHook(() => useWalletLogin(), {
            wrapper: createWrapper(),
        });

        await act(async () => { await result.current.connect(); });
        await act(async () => { await result.current.signAndLogin(); });

        await waitFor(() => {
            expect(result.current.isWalletNotFound).toBe(true);
        });
        expect(result.current.error).toBe('No user associated with this wallet');
    });

    it('keeps isWalletNotFound=false for non-404 API errors', async () => {
        simulateConnectSuccess();
        vi.mocked(api.postPublic).mockRejectedValue(
            new ApiServiceError('Internal server error', 500)
        );

        const { result } = renderHook(() => useWalletLogin(), {
            wrapper: createWrapper(),
        });

        await act(async () => { await result.current.connect(); });
        await act(async () => { await result.current.signAndLogin(); });

        await waitFor(() => {
            expect(result.current.error).toBeTruthy();
        });
        expect(result.current.isWalletNotFound).toBe(false);
    });

    it('clears wallet on auth failure so user has to reconnect', async () => {
        simulateConnectSuccess();
        vi.mocked(api.postPublic).mockRejectedValue(
            new ApiServiceError('Signature does not match wallet address', 401)
        );

        const { result } = renderHook(() => useWalletLogin(), {
            wrapper: createWrapper(),
        });

        await act(async () => { await result.current.connect(); });
        await act(async () => { await result.current.signAndLogin(); });

        await waitFor(() => {
            expect(result.current.walletAddress).toBeNull();
        });
        expect(appKit.disconnect).toHaveBeenCalled();
    });
});

describe('useWalletLogin — iOS reload hydration', () => {
    it('hydrates to awaiting-signature when AppKit already has a session (page reloaded after connect)', async () => {
        // Simulates iOS: the user connected, Safari reloaded the page on
        // return from MetaMask, so React state is fresh — but AppKit kept
        // the session in localStorage and getAddress() returns the wallet.
        vi.mocked(appKit.getAddress).mockReturnValue(MOCK_WALLET);
        vi.mocked(appKit.subscribeAccount).mockReturnValue(vi.fn());

        const { result } = renderHook(() => useWalletLogin(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.walletAddress).toBe(MOCK_WALLET_LC);
        });
        expect(result.current.isAwaitingSignature).toBe(true);
        // No connect() call, no modal opened — purely hydrated from storage.
        expect(appKit.open).not.toHaveBeenCalled();
    });

    it('hydrates when AppKit restores the address asynchronously after mount', async () => {
        // Some flows: getAddress() returns null on mount, but the relay
        // reconnects a moment later and subscribeAccount fires with the
        // restored address.
        vi.mocked(appKit.getAddress).mockReturnValue(undefined);
        let cb: ((account: { address?: string }) => void) | null = null;
        vi.mocked(appKit.subscribeAccount).mockImplementation((handler: any) => {
            cb = handler;
            return vi.fn();
        });

        const { result } = renderHook(() => useWalletLogin(), {
            wrapper: createWrapper(),
        });

        expect(result.current.walletAddress).toBeNull();

        await act(async () => {
            cb?.({ address: MOCK_WALLET });
        });

        expect(result.current.walletAddress).toBe(MOCK_WALLET_LC);
        expect(result.current.isAwaitingSignature).toBe(true);
    });
});

describe('useWalletLogin — reset', () => {
    it('clears connected state', async () => {
        simulateConnectSuccess();

        const { result } = renderHook(() => useWalletLogin(), {
            wrapper: createWrapper(),
        });

        await act(async () => { await result.current.connect(); });
        expect(result.current.walletAddress).toBe(MOCK_WALLET_LC);

        act(() => { result.current.reset(); });

        expect(result.current.walletAddress).toBeNull();
        expect(result.current.isAwaitingSignature).toBe(false);
        expect(result.current.error).toBeUndefined();
    });
});
