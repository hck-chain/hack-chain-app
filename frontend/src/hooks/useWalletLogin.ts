import { useState } from 'react';
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
    }
}

export const useWalletLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isWalletNotFound, setIsWalletNotFound] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    const mutation = useMutation({
        mutationFn: async ({ walletAddress, signature }: { walletAddress: string; signature: string }) => {
            return api.postPublic<WalletLoginResponse>('/api/auth/login', {
                wallet_address: walletAddress,
                signature,
            });
        },
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
            setIsWalletNotFound(notFound);
            setError(err.message);
            appKit.disconnect().catch(() => { });
        }
    });

    const connectAndLogin = async () => {
        setError(null);
        setIsWalletNotFound(false);

        try {
            setIsConnecting(true);

            // Si AppKit todavía tiene una conexión activa (puede quedar residual
            // tras un logout), forzamos disconnect antes de abrir para que el
            // modal muestre la pantalla de connect y no la de cuenta ya conectada.
            if (appKit.getAddress()) {
                await appKit.disconnect().catch(() => { });
            }

            // Forzamos el view 'Connect' para evitar que AppKit abra la vista
            // de cuenta (Account) si quedó algún residuo de sesión.
            await appKit.open({ view: 'Connect' });

            const walletAddress = await new Promise<string | null>((resolve) => {
                let resolved = false;
                let modalClosedTimer: ReturnType<typeof setTimeout> | null = null;

                const finish = (value: string | null) => {
                    if (resolved) return;
                    resolved = true;
                    if (modalClosedTimer) clearTimeout(modalClosedTimer);
                    unsubscribeAccount();
                    unsubscribeEvents();
                    resolve(value);
                };

                const unsubscribeAccount = appKit.subscribeAccount((account) => {
                    if (account.address) finish(account.address);
                });

                const unsubscribeEvents = appKit.subscribeEvents((event) => {
                    if (event.data.event === 'MODAL_CLOSE') {
                        // On iOS with mobile wallets, the modal closes when the user is
                        // redirected to the native wallet app. We wait a few seconds to
                        // let the account resolve before treating this as a cancellation.
                        modalClosedTimer = setTimeout(() => finish(null), 4000);
                    }
                });
            });

            if (!walletAddress) {
                setError("No wallet connected");
                return;
            }

            const normalizedAddress = walletAddress.toLowerCase();

            const { nonce } = await api.get<{ nonce: string }>(`/api/users/${normalizedAddress}/nonce`);

            const message = buildSignMessage(normalizedAddress, nonce);

            const walletProvider = appKit.getProvider('eip155');
            if (!walletProvider) throw new Error("Wallet provider unavailable");

            // On iOS, WalletConnect needs a moment to re-establish the relay session
            // after the deep-link return from the native wallet before it can send
            // the sign request reliably.
            await new Promise(r => setTimeout(r, 600));

            const signer = new ethers.providers.Web3Provider(walletProvider as ethers.providers.ExternalProvider).getSigner();
            const signature = await signer.signMessage(message);

            mutation.mutate({ walletAddress: normalizedAddress, signature });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to connect to wallet");
        } finally {
            setIsConnecting(false);
        }
    };

    return {
        connectAndLogin,
        isLoading: isConnecting || mutation.isPending,
        error: error || mutation.error?.message,
        isWalletNotFound,
    };
};