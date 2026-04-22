import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, ApiServiceError } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { appKit } from '@/config/walletConfig';

interface WalletLoginResponse {
    message: string;
    token: string;
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
        mutationFn: async (walletAddress: string) => {
            return api.postPublic<WalletLoginResponse>('/api/auth/login', {
                wallet_address: walletAddress,
            });
        },
        onSuccess: (data) => {
            login(data.token, {
                id: data.user.id,
                email: data.user.email ?? '',
                role: data.user.role,
                name: null,
                lastName: null,
                walletAddress: data.user.wallet_address,
            });

            if (data.user.role === 'student')        navigate('/dashboard/talent');
            else if (data.user.role === 'issuer')    navigate('/educator/dashboard');
            else if (data.user.role === 'recruiter') navigate('/dashboard/recruiter');
            else navigate('/');
        },
        onError: (err: Error) => {
            const notFound = err instanceof ApiServiceError && err.status === 404;
            setIsWalletNotFound(notFound);
            setError(err.message);
        }
    });

    const connectAndLogin = async () => {
        setError(null);
        setIsWalletNotFound(false);

        try {
            setIsConnecting(true);

            await appKit.open();

            // Wait for a connected address from the modal
            const walletAddress = await new Promise<string | null>((resolve) => {
                const unsubscribeAccount = appKit.subscribeAccount((account) => {
                    if (account.address) {
                        unsubscribeAccount();
                        resolve(account.address);
                    }
                });

                appKit.subscribeEvents((event) => {
                    if (event.data.event === 'MODAL_CLOSE') {
                        unsubscribeAccount();
                        resolve(null);
                    }
                });
            });

            if (!walletAddress) {
                setError("No wallet connected");
                return;
            }

            mutation.mutate(walletAddress);
        } catch (err: any) {
            setError(err.message || "Failed to connect to wallet");
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