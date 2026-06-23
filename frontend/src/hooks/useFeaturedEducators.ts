import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { FeaturedEducator } from '@/types/dashboard';

interface FeaturedEducatorsResponse {
  educators: FeaturedEducator[];
}

export function useFeaturedEducators(count = 3) {
  return useQuery<FeaturedEducatorsResponse>({
    queryKey: ['educators', 'featured', count],
    queryFn: () => api.get<FeaturedEducatorsResponse>(`/api/issuers/featured?count=${count}`),
    staleTime: 0,
    gcTime: 0,
  });
}
