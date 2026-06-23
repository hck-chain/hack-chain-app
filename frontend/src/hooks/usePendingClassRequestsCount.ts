import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export function usePendingClassRequestsCount() {
  const { user } = useAuth();
  const isEducator = user?.role === 'issuer';

  return useQuery<{ count: number }>({
    queryKey: ['class-requests', 'pending-count'],
    queryFn: () => api.get<{ count: number }>('/api/class-requests/pending-count'),
    enabled: isEducator,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}
