import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { EducatorProfile } from '@/types/dashboard';

interface EducatorProfileResponse {
  issuer: EducatorProfile;
}

export function useEducatorProfile(wallet: string | undefined) {
  return useQuery({
    queryKey: ['educator-profile', wallet],
    queryFn: async () => {
      const data = await api.get<EducatorProfileResponse>(`/api/issuers/${wallet}`);
      return data.issuer as EducatorProfile;
    },
    enabled: !!wallet,
    staleTime: 60_000,
    retry: 1,
  });
}
