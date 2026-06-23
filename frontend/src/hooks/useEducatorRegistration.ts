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
import { getConnectedWallet } from '@/utils/web3Service';

const registerEducator = async (
    educatorData: EducatorRegistrationRequestData & { wallet_address: string; role: string }
): Promise<EducatorRegistrationResponse> => {
    return api.postPublic<EducatorRegistrationResponse>('/api/users/register', educatorData);
};

export const useEducatorRegistration = () => {
    return useMutation({
        mutationFn: async (formData: EducatorRegistrationFormData) => {
            const requestData = transformEducatorFormDataToRequest(formData);
            const walletAddress = await getConnectedWallet(true);

            return registerEducator({
                ...requestData,
                wallet_address: walletAddress,
                role: 'issuer',
            });
        },
        onSuccess: () => {
            console.log("Educator registered successfully");
        },
        onError: (error: Error) => {
            console.error("Educator registration failed:", error.message);
        },
    });
};

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
