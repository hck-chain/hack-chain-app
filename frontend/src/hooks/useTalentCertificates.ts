import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { OpenSeaCertificate } from '@/types/dashboard';

export function useTalentCertificates(wallet: string | undefined) {
  return useQuery({
    queryKey: ['certificates', wallet],
    queryFn: () =>
      api.post<OpenSeaCertificate[]>('/api/opensea/certificates/', { address: wallet }),
    enabled: !!wallet,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
    retry: 0,
  });
}
