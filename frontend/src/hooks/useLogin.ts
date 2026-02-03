import { useMutation } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.VITE_API_URL;

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

interface ApiError {
  error: string;
  errors?: Array<{
    msg: string;
    param: string;
  }>;
}

export const useLogin = () => {
  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: async (credentials) => {
      console.log("API_URL:", import.meta.env.VITE_API_URL);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          (data as ApiError).error ||
          (data as ApiError).errors?.[0]?.msg ||
          "Login failed";
        throw new Error(errorMessage);
      }

      return data as LoginResponse;
    },
  });
};
