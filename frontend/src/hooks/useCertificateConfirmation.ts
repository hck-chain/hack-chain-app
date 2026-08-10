import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface PendingConfirmationCertificate {
  id: number;
  title: string;
  confirmation_deadline: string | null;
}

const QUERY_KEY = ['certificates', 'pending-confirmation'] as const;

export function usePendingCertificateConfirmations() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      api.get<{ certificates: PendingConfirmationCertificate[] }>('/api/certificates/pending-confirmation')
        .then((d) => d.certificates),
    staleTime: 30_000,
  });
}

export function useConfirmCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/api/certificates/${id}/confirm`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useFlagCertificateIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      api.patch(`/api/certificates/${id}/flag`, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
