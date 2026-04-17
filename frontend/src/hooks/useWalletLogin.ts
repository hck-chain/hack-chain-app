import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext'; // ← agregar

// ... interfaces igual ...

export const useWalletLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth(); // ← agregar
    const [error, setError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const mutation = useMutation({
        mutationFn: async (walletAddress: string) => {
            return api.postPublic<WalletLoginResponse>('/api/auth/login', {
                wallet_address: walletAddress,
            });
        },
        onSuccess: (data) => {
            // ← reemplazar los localStorage.setItem por esto:
            login(data.token, {
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
            setError(err.message);
        }
    });

    // ... connectAndLogin igual ...
};