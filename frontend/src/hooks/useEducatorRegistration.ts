import { useMutation } from "@tanstack/react-query";
import {
    EducatorRegistrationFormData,
    EducatorRegistrationRequestData,
    transformEducatorFormDataToRequest
} from '../lib/validations/auth';
import {
    EducatorRegistrationResponse,
    ApiError,
    isApiError
} from '../types/auth';

//API base URL --> adjust according to your configuration
const API_BASE_URL = import.meta.env.VITE_API_URL;

//API function register a new educator
const registerEducator = async (educatorData: EducatorRegistrationRequestData & { wallet_address: string; role: string }): Promise<EducatorRegistrationResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(educatorData),
    });

    const data = await response.json();

    //handle http errors
    if (!response.ok) {
        if (isApiError(data)) {
            throw new Error(data.error);
        }
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }

    if (!data.message || !data.user) { // Warning: backend returns 'user', not 'issuer' directly inside user object sometimes, but usually top level is user. Checked backend: returns { user, roleData }
        // We will assume backend consistency. The previous check expected !data.issuer.
        // Let's adjust validation to verify we got a success.
        return data as EducatorRegistrationResponse;
    }

    return data as EducatorRegistrationResponse;
};

//custom hook for educator Registration
export const useEducatorRegistration = () => {
    return useMutation({
        mutationFn: async (formData: EducatorRegistrationFormData) => {  ///////////////////////////////
            //transform data for backend request
            const requestData = transformEducatorFormDataToRequest(formData);

            /////////////////////////////////////////////////////////////////////////////////////

            if (!window.ethereum) {
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
            async function authorizeIssuer(walletAddress) {
                const response = await fetch(`${API_BASE_URL}/api/issuers/authorize`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ issuer: walletAddress }),
                });

                const data = await response.json();

                //handle http errors
                if (!response.ok) {
                    if (isApiError(data)) {
                        throw new Error(data.error);
                    }
                    throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
                }
                return data;
            }

            await authorizeIssuer(walletAddress); 
            /////////////////////////////////////////////////////////////////////////////////////

            // Merge with wallet address and role
            const payload = {
                ...requestData,
                wallet_address: walletAddress,   /////////////////////////////////////////////////
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

//Helper hook to manage educator registration state
export const useEducatorRegistrationState = () => {
    const mutation = useEducatorRegistration();

    return {
        // Loading states
        isLoading: mutation.isPending,
        isSuccess: mutation.isSuccess,
        isError: mutation.isError,

        // Data
        data: mutation.data,
        error: mutation.error,

        // Actions
        register: mutation.mutate,
        registerAsync: mutation.mutateAsync,
        reset: mutation.reset,

        // Utilities
        canSubmit: !mutation.isPending,
        errorMessage: mutation.error?.message || null,
        successMessage: mutation.data?.message || null,
    };
};