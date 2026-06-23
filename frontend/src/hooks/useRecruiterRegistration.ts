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
import { getConnectedWallet } from '@/utils/web3Service';

const registerRecruiter = async (
    recruiterData: RecruiterRegistrationRequestData & { wallet_address: string; role: string }
): Promise<RecruiterRegistrationResponse> => {
    return api.postPublic<RecruiterRegistrationResponse>('/api/users/register', recruiterData);
};

export const useRecruiterRegistration = () => {
    return useMutation({
        mutationFn: async (formData: RecruiterRegistrationFormData) => {
            const requestData = transformRecruiterFormDataToRequest(formData);
            const walletAddress = await getConnectedWallet(true);

            return registerRecruiter({
                ...requestData,
                wallet_address: walletAddress,
                role: 'recruiter',
            });
        },
        onSuccess: () => {
            console.log("Recruiter registered successfully");
        },
        onError: (error: Error) => {
            console.error("Recruiter registration failed:", error.message);
        },
    });
};

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
