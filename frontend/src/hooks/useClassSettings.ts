import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { ClassSettings } from '@/types/dashboard';

const QUERY_KEY = ['educator-class-settings'];

export function useMyClassSettings() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await api.get<{ class_settings: ClassSettings | null }>('/api/issuers/me/classes');
      return res.class_settings;
    },
    staleTime: 30_000,
    retry: 1,
  });
}

export function useUpdateClassSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ClassSettings>) => {
      return api.patch<{ class_settings: ClassSettings }>('/api/issuers/me/classes', payload);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data.class_settings);
    },
  });
}
