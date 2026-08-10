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
  payment_status: PaymentStatus;
  currency: string;
  amount: string | null;
  deposit_proof_url: string | null;
  deposit_proof_cid: string | null;
  final_proof_url: string | null;
  final_proof_cid: string | null;
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

export function useSubmitPaymentProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, stage, proofUrl, proofCid, amount, currency, paymentNetwork,
    }: {
      id: number; stage: PaymentStage; proofUrl?: string; proofCid?: string;
      amount?: string; currency?: string; paymentNetwork?: string;
    }) =>
      api.post(`/api/class-requests/${id}/payments/${stage}`, {
        proof_url: proofUrl,
        proof_cid: proofCid,
        amount,
        currency,
        payment_network: paymentNetwork,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDisputePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: PaymentStage }) =>
      api.patch(`/api/class-requests/${id}/payments/${stage}/dispute`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
