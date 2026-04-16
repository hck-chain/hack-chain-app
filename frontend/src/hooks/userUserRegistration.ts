import { useMutation } from "@tanstack/react-query";
import {
    UserRegistrationFormData,
    UserRegistrationRequestData,
    transformFormDataToRequest
} from '../lib/validations/auth';
import {
    UserRegistrationResponse,
} from '../types/auth';
import { api } from '@/services/api';

// API function register a new user
const registerUser = async (
    requestData: UserRegistrationRequestData & { wallet_address: string; role: string }
): Promise<UserRegistrationResponse> => {
    return api.postPublic<UserRegistrationResponse>('/api/users/register', requestData);
};

// Custom hook for user Registration
export const useUserRegistration = () => {
    return useMutation({
        mutationFn: async (formData: UserRegistrationFormData) => {
            const requestData = transformFormDataToRequest(formData);

            if (!window.ethereum) {
                throw new Error("MetaMask not detected");
            }

            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });

            if (!accounts || accounts.length === 0) {
                throw new Error("No account selected");
            }

            const walletAddress = accounts[0];

            const payload = {
                ...requestData,
                wallet_address: walletAddress,
                role: 'student'
            };
            return registerUser(payload);
        },
        onSuccess: (data: UserRegistrationResponse) => {
            console.log("User registered successfully:", data.user.email);
        },
        onError: (error: Error) => {
            console.error("User registration failed:", error.message);
        },
    });
};

// Helper hook to manage registration state
export const useRegistrationState = () => {
    const mutation = useUserRegistration();

    return {
        isLoading: mutation.isPending,
        isSuccess: mutation.isSuccess,
        isError: mutation.isError,
        data: mutation.data,
        error: mutation.error,
        register: mutation.mutate,
        registerAsync: mutation.mutateAsync,
        reset: mutation.reset,
        canSubmit: !mutation.isPending,
        errorMessage: mutation.error?.message || null,
        successMessage: mutation.data?.message || null,
    };
};