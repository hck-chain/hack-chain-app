import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

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
    const [error, setError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const mutation = useMutation({
        mutationFn: async (walletAddress: string) => {
            return api.postPublic<WalletLoginResponse>('/api/auth/login', {
                wallet_address: walletAddress,
            });
        },
        onSuccess: (data) => {
            // Store auth data
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role
            if (data.user.role === 'student') {
                navigate('/dashboard/talent');
            } else if (data.user.role === 'issuer') {
                navigate('/educator/dashboard');
            } else if (data.user.role === 'recruiter') {
                navigate('/dashboard/recruiter');
            } else {
                navigate('/dashboard');
            }
        },
        onError: (err: Error) => {
            setError(err.message);
        }
    });

    const connectAndLogin = async () => {
        setError(null);

        try {
            setIsConnecting(true);

            if (!window.ethereum) {
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (isMobile) {
                    window.location.href = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
                    setIsConnecting(false);
                    return;
                }
                throw new Error("MetaMask not detected");
            }

            await window.ethereum.request({
                method: "wallet_requestPermissions",
                params: [{ eth_accounts: {} }],
            });

            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });

            const walletAddress = accounts[0];
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
    };
};
