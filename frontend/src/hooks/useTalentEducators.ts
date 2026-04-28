import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Educator } from '@/types/dashboard';

export function useTalentEducators(wallet: string | undefined) {
  return useQuery({
    queryKey: ['educators', wallet],
    queryFn: async () => {
      const data = await api.get<{ educators: Educator[] }>(
        `/api/students/${wallet}/educators`
      );
      return data.educators;
    },
    enabled: !!wallet,
    staleTime: 30_000,
  });
}
