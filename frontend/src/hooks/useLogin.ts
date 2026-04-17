import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useNavigate } from "react-router-dom";s

interface LoginCredentials {
  wallet_address: string; 
  role: string;          
}

interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    email: string | null;
    role: string; 
    wallet_address: string; 
  };
}

export const useLogin = () => {
  const navigate = useNavigate();

  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: async (credentials) => {
      // Enviamos wallet_address y role
      return api.postPublic<LoginResponse>('/api/auth/login', credentials);
    },
    onSuccess: (data) => {
    
      localStorage.setItem("token", data.token);

      const role = data.user.role.toLowerCase();
      
      if (role === 'student') navigate('/dashboard-talent');
      else if (role === 'issuer') navigate('/dashboard-issuer');
      else if (role === 'recruiter') navigate('/dashboard-recruiter');
      else navigate('/'); 
    },
    onError: (error) => {
      console.error("Error en el login:", error);
      alert("No se pudo iniciar sesión. Revisa tu wallet o rol.");
    }
  });
};