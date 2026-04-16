import { useMutation } from "@tanstack/react-query";
import {
    RecruiterRegistrationFormData,
    RecruiterRegistrationRequestData,
    transformRecruiterFormDataToRequest
} from '../lib/validations/auth';
import {
    RecruiterRegistrationResponse,
} from '../types/auth';
import { api } from '@/services/api';

// API function register a new recruiter
const registerRecruiter = async (
    recruiterData: RecruiterRegistrationRequestData & { wallet_address: string; role: string }
): Promise<RecruiterRegistrationResponse> => {
    return api.postPublic<RecruiterRegistrationResponse>('/api/users/register', recruiterData);
};

// Custom hook for recruiter Registration
export const useRecruiterRegistration = () => {
    return useMutation({
        mutationFn: async (formData: RecruiterRegistrationFormData) => {
            const requestData = transformRecruiterFormDataToRequest(formData);

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
                role: 'recruiter'
            };
            return registerRecruiter(payload);
        },
        onSuccess: (data: RecruiterRegistrationResponse) => {
            console.log("Recruiter registered successfully");
        },
        onError: (error: Error) => {
            console.error("Recruiter registration failed:", error.message);
        },
    });
};

// Helper hook to manage recruiter registration state
export const useRecruiterRegistrationState = () => {
    const mutation = useRecruiterRegistration();

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