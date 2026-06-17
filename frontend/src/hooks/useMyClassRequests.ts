import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface MyClassRequest {
  id: number;
  issuer_organization: string | null;
  issuer_wallet: string;
  requested_date: string;
  start_time: string;
  duration_minutes: number;
  hourly_rate_usd: string | null;
  class_name: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

interface MyClassRequestsResponse {
  requests: MyClassRequest[];
}

export function useMyClassRequests() {
  return useQuery<MyClassRequest[]>({
    queryKey: ['my-class-requests'],
    queryFn: () =>
      api.get<MyClassRequestsResponse>('/api/class-requests/sent').then((r) => r.requests),
  });
}
