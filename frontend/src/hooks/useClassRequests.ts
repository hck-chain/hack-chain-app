import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface ClassRequest {
  id: number;
  student_name: string | null;
  student_wallet: string;
  requested_date: string;
  start_time: string;
  duration_minutes: number;
  hourly_rate_usd: string | null;
  student_message: string | null;
  class_name: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

const QUERY_KEY = ['class-requests', 'mine'] as const;

export function useClassRequests() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.get<{ requests: ClassRequest[] }>('/api/class-requests/mine').then((d) => d.requests),
    staleTime: 30_000,
  });
}

export function useUpdateClassRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'confirmed' | 'cancelled' | 'completed' }) =>
      api.patch<{ id: number; status: string }>(`/api/class-requests/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
