import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  message: string;
  token: string;
  expiresIn: string;
  user: {
    id: number;
    email: string;
    role: string;
    name: string | null;
    lastName: string | null;
    walletAddress: string | null;
  };
}

export const useLogin = () => {
  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: async (credentials) => {
      return api.postPublic<LoginResponse>('/api/auth/login', credentials);
    },
  });
};
