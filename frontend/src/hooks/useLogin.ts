import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface LoginResponse {
  message: string;
  user: {
    id: number;
    email: string | null;
    role: string;
    wallet_address: string;
  };
}

export const useLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  return useMutation({
    mutationFn: async (credentials: { wallet_address: string }) => {
      return api.postPublic<LoginResponse>('/api/auth/login', credentials);
    },
    onSuccess: (data) => {
      login({
        id: data.user.id,
        email: data.user.email ?? '',
        role: data.user.role,
        name: null,
        lastName: null,
        walletAddress: data.user.wallet_address,
      });

      const role = data.user.role.toLowerCase();
      if (role === 'student') navigate('/dashboard/talent');
      else if (role === 'recruiter') navigate('/dashboard/recruiter');
      else if (role === 'issuer') navigate('/educator/dashboard');
      else navigate('/');
    },
    onError: (error) => {
      console.error("Error en el login:", error);
      alert("No se pudo iniciar sesión. Revisa tu wallet.");
    }
  });
};
