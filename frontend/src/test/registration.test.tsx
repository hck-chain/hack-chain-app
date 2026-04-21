import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

// Mock AppKit before importing hooks that depend on it
vi.mock('@/config/walletConfig', () => ({
    appKit: {
        getAddress: vi.fn(),
        open: vi.fn(),
        subscribeAccount: vi.fn(),
        subscribeEvents: vi.fn(),
    },
}));

vi.mock('@/services/api', () => ({
    api: {
        postPublic: vi.fn(),
    },
}));

import { appKit } from '@/config/walletConfig';
import { api } from '@/services/api';
import { useUserRegistration } from '@/hooks/userUserRegistration';
import { useEducatorRegistration } from '@/hooks/useEducatorRegistration';
import { useRecruiterRegistration } from '@/hooks/useRecruiterRegistration';

const MOCK_WALLET = '0xabc123def456abc123def456abc123def456abc1';

const createWrapper = () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client }, children);
};

// Helper: simulate a wallet connecting after modal opens
const simulateWalletConnect = (address = MOCK_WALLET) => {
    vi.mocked(appKit.getAddress).mockReturnValue(undefined);
    vi.mocked(appKit.open).mockResolvedValue(undefined);
    vi.mocked(appKit.subscribeAccount).mockImplementation((cb: any) => {
        setTimeout(() => cb({ address }), 0);
        return vi.fn();
    });
    vi.mocked(appKit.subscribeEvents).mockReturnValue(vi.fn());
};

// Helper: simulate user closing modal without connecting
const simulateModalClose = () => {
    vi.mocked(appKit.getAddress).mockReturnValue(undefined);
    vi.mocked(appKit.open).mockResolvedValue(undefined);
    vi.mocked(appKit.subscribeAccount).mockImplementation(() => vi.fn());
    vi.mocked(appKit.subscribeEvents).mockImplementation((cb: any) => {
        setTimeout(() => cb({ data: { event: 'MODAL_CLOSE' } }), 0);
        return vi.fn();
    });
};

// Helper: simulate wallet already connected (no modal needed)
const simulateAlreadyConnected = (address = MOCK_WALLET) => {
    vi.mocked(appKit.getAddress).mockReturnValue(address);
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useUserRegistration', () => {
    it('registers student with wallet address from AppKit modal', async () => {
        simulateWalletConnect();
        vi.mocked(api.postPublic).mockResolvedValue({
            message: 'User created',
            user: { id: 1, email: 'test@test.com', role: 'student', wallet_address: MOCK_WALLET },
        });

        const { result } = renderHook(() => useUserRegistration(), { wrapper: createWrapper() });

        result.current.mutate({ name: 'John', lastName: 'Doe', email: 'test@test.com' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.postPublic).toHaveBeenCalledWith('/api/users/register', expect.objectContaining({
            wallet_address: MOCK_WALLET,
            role: 'student',
        }));
    });

    it('registers student without reopening modal when wallet is already connected', async () => {
        simulateAlreadyConnected();
        vi.mocked(api.postPublic).mockResolvedValue({
            message: 'User created',
            user: { id: 1, email: 'test@test.com', role: 'student', wallet_address: MOCK_WALLET },
        });

        const { result } = renderHook(() => useUserRegistration(), { wrapper: createWrapper() });

        result.current.mutate({ name: 'Jane', lastName: 'Doe', email: 'jane@test.com' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(appKit.open).not.toHaveBeenCalled();
        expect(api.postPublic).toHaveBeenCalledWith('/api/users/register', expect.objectContaining({
            wallet_address: MOCK_WALLET,
            role: 'student',
        }));
    });

    it('fails when user closes the modal without connecting', async () => {
        simulateModalClose();

        const { result } = renderHook(() => useUserRegistration(), { wrapper: createWrapper() });

        result.current.mutate({ name: 'John', lastName: 'Doe', email: 'test@test.com' });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error?.message).toBe('Wallet connection cancelled');
        expect(api.postPublic).not.toHaveBeenCalled();
    });
});

describe('useEducatorRegistration', () => {
    it('registers educator, authorizes on-chain, and sends correct role', async () => {
        simulateWalletConnect();
        vi.mocked(api.postPublic)
            .mockResolvedValueOnce({}) // authorize call
            .mockResolvedValueOnce({  // register call
                message: 'Educator created',
                user: { id: 2, email: 'edu@test.com', role: 'issuer', wallet_address: MOCK_WALLET },
            });

        const { result } = renderHook(() => useEducatorRegistration(), { wrapper: createWrapper() });

        result.current.mutate({ organizationName: 'HackSchool', email: 'edu@test.com' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.postPublic).toHaveBeenCalledWith('/api/issuers/authorize', { issuer: MOCK_WALLET });
        expect(api.postPublic).toHaveBeenCalledWith('/api/users/register', expect.objectContaining({
            wallet_address: MOCK_WALLET,
            role: 'issuer',
        }));
    });

    it('fails when user closes the modal without connecting', async () => {
        simulateModalClose();

        const { result } = renderHook(() => useEducatorRegistration(), { wrapper: createWrapper() });

        result.current.mutate({ organizationName: 'HackSchool', email: 'edu@test.com' });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error?.message).toBe('Wallet connection cancelled');
        expect(api.postPublic).not.toHaveBeenCalled();
    });
});

describe('useRecruiterRegistration', () => {
    it('registers recruiter with correct role', async () => {
        simulateWalletConnect();
        vi.mocked(api.postPublic).mockResolvedValue({
            message: 'Recruiter created',
            user: { id: 3, email: 'recruiter@test.com', role: 'recruiter', wallet_address: MOCK_WALLET },
        });

        const { result } = renderHook(() => useRecruiterRegistration(), { wrapper: createWrapper() });

        result.current.mutate({ name: 'Alice', lastName: 'Smith', companyName: 'TechCorp', email: 'recruiter@test.com' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.postPublic).toHaveBeenCalledWith('/api/users/register', expect.objectContaining({
            wallet_address: MOCK_WALLET,
            role: 'recruiter',
        }));
    });

    it('fails when user closes the modal without connecting', async () => {
        simulateModalClose();

        const { result } = renderHook(() => useRecruiterRegistration(), { wrapper: createWrapper() });

        result.current.mutate({ name: 'Alice', lastName: 'Smith', companyName: 'TechCorp', email: 'recruiter@test.com' });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error?.message).toBe('Wallet connection cancelled');
    });
});
