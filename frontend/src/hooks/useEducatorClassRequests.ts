import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface EducatorClassRequest {
  id: number;
  student_name: string | null;
  student_wallet: string;
  requested_date: string;
  start_time: string;
  duration_minutes: number;
  hourly_rate_usd: number | null;
  student_message: string | null;
  class_name: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

interface ClassRequestsResponse {
  requests: EducatorClassRequest[];
}

export function useEducatorClassRequests() {
  return useQuery<EducatorClassRequest[]>({
    queryKey: ['class-requests', 'educator-mine'],
    queryFn: () => api.get<ClassRequestsResponse>('/api/class-requests/mine').then(d => d.requests),
    staleTime: 15_000,
  });
}

export function useUpdateClassRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/api/class-requests/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-requests', 'educator-mine'] });
      queryClient.invalidateQueries({ queryKey: ['class-requests', 'pending-count'] });
    },
  });
}
