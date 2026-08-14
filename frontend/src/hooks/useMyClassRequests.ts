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

export interface MyClassRequest {
  id: number;
  issuer_organization: string | null;
  issuer_photo: string | null;
  issuer_wallet: string;
  requested_date: string;
  start_time: string;
  duration_minutes: number;
  hourly_rate_usd: string | null;
  class_name: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: PaymentStatus;
  currency: string;
  amount: string | null;
  deposit_proof_url: string | null;
  deposit_proof_cid: string | null;
  final_proof_url: string | null;
  final_proof_cid: string | null;
  meeting_url: string | null;
  created_at: string;
  updated_at: string;
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

export function useSubmitPaymentProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, stage, proofUrl, proofCid, txHash, amount, currency, paymentNetwork,
    }: {
      id: number; stage: PaymentStage; proofUrl?: string; proofCid?: string; txHash?: string;
      amount?: string; currency?: string; paymentNetwork?: string;
    }) =>
      api.post(`/api/class-requests/${id}/payments/${stage}`, {
        proof_url: proofUrl,
        proof_cid: proofCid,
        tx_hash: txHash,
        amount,
        currency,
        payment_network: paymentNetwork,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-class-requests'] }),
  });
}

export function useDisputePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: PaymentStage }) =>
      api.patch(`/api/class-requests/${id}/payments/${stage}/dispute`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-class-requests'] }),
  });
}

export function useCancelClassRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      api.patch(`/api/class-requests/${id}/cancel`, {
        cancellation_reason: reason || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-class-requests'] });
    },
  });
}
