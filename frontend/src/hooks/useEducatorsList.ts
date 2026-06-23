import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { FeaturedEducator } from '@/types/dashboard';

interface EducatorsListResponse {
  educators: FeaturedEducator[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export function useEducatorsList(page = 1, limit = 12, area?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (area) params.set('area', area);

  return useQuery<EducatorsListResponse>({
    queryKey: ['educators', 'list', page, limit, area ?? ''],
    queryFn: () => api.get<EducatorsListResponse>(`/api/issuers?${params.toString()}`),
    staleTime: 30_000,
  });
}
