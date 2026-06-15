import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface ClassRequestPayload {
  issuer_wallet_address: string;
  requested_date: string;
  start_time: string;
  duration_minutes: number;
  hourly_rate_usd?: number | null;
  student_message?: string | null;
}

interface ClassRequestResponse {
  id: number;
  status: string;
}

export function useRequestClass() {
  return useMutation<ClassRequestResponse, Error, ClassRequestPayload>({
    mutationFn: (payload) => api.post<ClassRequestResponse>('/api/class-requests', payload),
  });
}
