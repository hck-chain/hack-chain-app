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
import { getConnectedWallet } from '@/utils/web3Service';

const registerUser = async (
    requestData: UserRegistrationRequestData & { wallet_address: string; role: string }
): Promise<UserRegistrationResponse> => {
    return api.postPublic<UserRegistrationResponse>('/api/users/register', requestData);
};

export const useUserRegistration = () => {
    return useMutation({
        mutationFn: async (formData: UserRegistrationFormData) => {
            const requestData = transformFormDataToRequest(formData);
            const walletAddress = await getConnectedWallet(true);

            return registerUser({
                ...requestData,
                wallet_address: walletAddress,
                role: 'student',
            });
        },
        onSuccess: (data: UserRegistrationResponse) => {
            console.log("User registered successfully:", data.user.email);
        },
        onError: (error: Error) => {
            console.error("User registration failed:", error.message);
        },
    });
};

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
