import { useCallback, useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, ApiServiceError } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { appKit } from '@/config/walletConfig';

const buildSignMessage = (address: string, nonce: string) =>
    `HackChain wants you to sign in with your Ethereum account:\n${address}\n\nSign in to HackChain\n\nNonce: ${nonce}`;

interface WalletLoginResponse {
    message: string;
    user: {
        id: number;
        email: string;
        role: string;
        wallet_address: string;
    };
}

type Phase = 'idle' | 'connecting' | 'awaiting-signature' | 'signing';

export const useWalletLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [phase, setPhase] = useState<Phase>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isWalletNotFound, setIsWalletNotFound] = useState(false);
    const isMountedRef = useRef(true);

    useEffect(() => () => { isMountedRef.current = false; }, []);

    const safeSet = <T,>(setter: (v: T) => void, value: T) => {
        if (isMountedRef.current) setter(value);
    };

    // Tracks whether an active connect()/signAndLogin() owns the state
    // machine. While owned, the hydration listener stays out of the way.
    const flowOwnedRef = useRef(false);

    // iOS Safari frequently reloads the page when returning from a deeplinked
    // wallet app (MetaMask, Rainbow, etc.). The reload wipes React state, so
    // walletAddress would be null again and the user would see the "Connect"
    // button instead of "Sign". AppKit persists the WalletConnect session in
    // localStorage, so on mount we hydrate from there and jump straight to the
    // awaiting-signature phase if a connection already exists.
    useEffect(() => {
        const hydrate = (address: string) => {
            if (flowOwnedRef.current || !isMountedRef.current) return;
            setWalletAddress(address.toLowerCase());
            setPhase('awaiting-signature');
        };

        const existing = appKit.getAddress();
        if (existing) hydrate(existing);

        // AppKit may restore the address asynchronously after the relay
        // reconnects. Subscribe so we hydrate as soon as it surfaces.
        const unsubscribe = appKit.subscribeAccount((account) => {
            if (account.address) hydrate(account.address);
        });

        return () => { unsubscribe?.(); };
    }, []);

    const reset = useCallback(() => {
        setWalletAddress(null);
        setPhase('idle');
        setError(null);
        setIsWalletNotFound(false);
        // Drop the persisted AppKit session too, otherwise the hydration
        // listener would re-populate walletAddress on next render.
        appKit.disconnect().catch(() => { });
    }, []);

    const mutation = useMutation({
        mutationFn: async ({ walletAddress, signature }: { walletAddress: string; signature: string }) =>
            api.postPublic<WalletLoginResponse>('/api/auth/login', {
                wallet_address: walletAddress,
                signature,
            }),
        onSuccess: (data) => {
            login({
                id: data.user.id,
                email: data.user.email ?? '',
                role: data.user.role,
                name: null,
                lastName: null,
                walletAddress: data.user.wallet_address,
            });

            if (data.user.role === 'student') navigate('/dashboard/talent');
            else if (data.user.role === 'issuer') navigate('/educator/dashboard');
            else if (data.user.role === 'recruiter') navigate('/dashboard/recruiter');
            else navigate('/');
        },
        onError: (err: Error) => {
            const notFound = err instanceof ApiServiceError && err.status === 404;
            safeSet(setIsWalletNotFound, notFound);
            safeSet(setError, err.message);
            // Clear wallet so the user has to reconnect (and pick the right account).
            safeSet(setWalletAddress, null);
            appKit.disconnect().catch(() => { });
        },
    });

    /**
     * Phase 1: open the wallet modal and resolve the connected address.
     * Must run inside the user gesture that started the flow.
     */
    const connect = useCallback(async (): Promise<string | null> => {
        flowOwnedRef.current = true;
        setError(null);
        setIsWalletNotFound(false);
        setPhase('connecting');

        try {
            // Drop any residual session so the modal opens on the Connect view,
            // not on an Account view from a previous login.
            if (appKit.getAddress()) {
                await appKit.disconnect().catch(() => { });
            }

            await appKit.open({ view: 'Connect' });

            const address = await new Promise<string | null>((resolve) => {
                let resolved = false;
                const finish = (value: string | null) => {
                    if (resolved) return;
                    resolved = true;
                    unsubscribeAccount();
                    unsubscribeEvents();
                    resolve(value);
                };

                const unsubscribeAccount = appKit.subscribeAccount((account) => {
                    if (account.address) finish(account.address);
                });

                const unsubscribeEvents = appKit.subscribeEvents((event) => {
                    if (event.data.event === 'MODAL_CLOSE') {
                        // If the modal closes without an account being set, treat as cancel.
                        // The current address (if any) is read synchronously to avoid the
                        // iOS deeplink race that caused the previous 4s timeout hack.
                        if (!appKit.getAddress()) finish(null);
                    }
                });
            });

            if (!address) {
                safeSet(setError, 'No wallet connected');
                safeSet(setPhase, 'idle');
                return null;
            }

            const normalized = address.toLowerCase();
            safeSet(setWalletAddress, normalized);
            safeSet(setPhase, 'awaiting-signature');
            return normalized;
        } catch (err: unknown) {
            safeSet(setError, err instanceof Error ? err.message : 'Failed to connect to wallet');
            safeSet(setPhase, 'idle');
            return null;
        } finally {
            flowOwnedRef.current = false;
        }
    }, []);

    /**
     * Phase 2: request the signature and authenticate.
     *
     * MUST be invoked from a fresh user gesture (a button onClick, NOT chained
     * after connect()). On iOS Safari, only handlers running inside an active
     * user gesture can deeplink back to the wallet app and surface the signing
     * prompt. Auto-signing right after connect breaks on iOS because the gesture
     * context is lost when the browser regains focus from the wallet app.
     */
    const signAndLogin = useCallback(async () => {
        if (!walletAddress) {
            setError('Connect your wallet first');
            return;
        }

        setError(null);
        setIsWalletNotFound(false);
        setPhase('signing');

        try {
            const walletProvider = appKit.getProvider('eip155');
            if (!walletProvider) throw new Error('Wallet provider unavailable');

            const { nonce } = await api.get<{ nonce: string }>(
                `/api/users/${walletAddress}/nonce`
            );
            const message = buildSignMessage(walletAddress, nonce);

            const signer = new ethers.providers.Web3Provider(
                walletProvider as ethers.providers.ExternalProvider
            ).getSigner();
            const signature = await signer.signMessage(message);

            mutation.mutate({ walletAddress, signature });
        } catch (err: unknown) {
            safeSet(setError, err instanceof Error ? err.message : 'Failed to sign message');
            safeSet(setPhase, 'awaiting-signature');
        }
    }, [walletAddress, mutation]);

    return {
        connect,
        signAndLogin,
        reset,
        walletAddress,
        phase,
        isConnecting: phase === 'connecting',
        isAwaitingSignature: phase === 'awaiting-signature',
        isSigning: phase === 'signing' || mutation.isPending,
        isLoading: phase !== 'idle' || mutation.isPending,
        error: error || mutation.error?.message,
        isWalletNotFound,
    };
};
