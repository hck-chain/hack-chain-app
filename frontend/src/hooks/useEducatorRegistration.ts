import { useMutation } from "@tanstack/react-query";
import {
    EducatorRegistrationFormData,
    EducatorRegistrationRequestData,
    transformEducatorFormDataToRequest
} from '../lib/validations/auth';
import {
    EducatorRegistrationResponse,
} from '../types/auth';
import { api } from '@/services/api';

// API function register a new educator
const registerEducator = async (
    educatorData: EducatorRegistrationRequestData & { wallet_address: string; role: string }
): Promise<EducatorRegistrationResponse> => {
    return api.postPublic<EducatorRegistrationResponse>('/api/users/register', educatorData);
};

// Custom hook for educator Registration
export const useEducatorRegistration = () => {
    return useMutation({
        mutationFn: async (formData: EducatorRegistrationFormData) => {
            const requestData = transformEducatorFormDataToRequest(formData);

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

            // Authorize the wallet as an issuer on-chain
            await api.postPublic('/api/issuers/authorize', { issuer: walletAddress });

            const payload = {
                ...requestData,
                wallet_address: walletAddress,
                role: 'issuer'
            };
            return registerEducator(payload);
        },
        onSuccess: (data: EducatorRegistrationResponse) => {
            console.log("Educator registered successfully");
        },
        onError: (error: Error) => {
            console.error("Educator registration failed:", error.message);
        },
    });
};

// Helper hook to manage educator registration state
export const useEducatorRegistrationState = () => {
    const mutation = useEducatorRegistration();

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