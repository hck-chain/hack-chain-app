import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

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

    const mutation = useMutation({
        mutationFn: async (walletAddress: string) => {
            // TODO: BACKEND DEVELOPER - Implement this endpoint!
            // Endpoint: POST /api/auth/login-wallet
            // Body: { wallet_address: string }
            // Response: { token: string, user: { id, email, role, wallet_address } }
            const response = await fetch(`${API_BASE_URL}/api/auth/login-wallet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ wallet_address: walletAddress }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to authenticate with wallet');
            }

            return response.json() as Promise<WalletLoginResponse>;
        },
        onSuccess: (data) => {
            // Store auth data
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role
            if (data.user.role === 'student') {
                navigate('/dashboard/student');
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

        if (!window.ethereum) {
            setError("MetaMask is not installed. Please install it to continue.");
            return;
        }

        try {
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts && accounts.length > 0) {
                const address = accounts[0];
                // Attempt login with backend
                mutation.mutate(address);
            } else {
                setError("No accounts found. Please unlock MetaMask.");
            }
        } catch (err: any) {
            console.error("Wallet connection error:", err);
            setError(err.message || "Failed to connect wallet.");
        }
    };

    return {
        connectAndLogin,
        isLoading: mutation.isPending,
        error: error || mutation.error?.message,
    };
};
