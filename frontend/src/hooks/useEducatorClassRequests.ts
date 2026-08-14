import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export type PaymentStatus =
  | 'unpaid'
  | 'deposit_submitted'
  | 'deposit_confirmed'
  | 'deposit_disputed'
  | 'final_submitted'
  | 'paid'
  | 'final_disputed';

export type PaymentStage = 'deposit' | 'final';

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
  payment_status: PaymentStatus;
  currency: string;
  amount: string | null;
  deposit_proof_url: string | null;
  deposit_proof_cid: string | null;
  final_proof_url: string | null;
  final_proof_cid: string | null;
  deposit_tx_hash: string | null;
  final_tx_hash: string | null;
  meeting_url: string | null;
  created_at: string;
  updated_at: string;
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

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: PaymentStage }) =>
      api.patch(`/api/class-requests/${id}/payments/${stage}/confirm`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-requests', 'educator-mine'] });
    },
  });
}

export function useUpdateClassRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, cancellationReason, meetingUrl }: {
      id: number; status: string; cancellationReason?: string; meetingUrl?: string;
    }) =>
      api.patch(`/api/class-requests/${id}/status`, {
        status,
        cancellation_reason: cancellationReason || undefined,
        meeting_url: meetingUrl || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-requests', 'educator-mine'] });
      queryClient.invalidateQueries({ queryKey: ['class-requests', 'pending-count'] });
    },
  });
}
