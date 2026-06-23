import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { IssuerClass } from '@/types/dashboard';

interface ClassesResponse {
  classes: IssuerClass[];
}

// Public — talent sees active classes for a given educator wallet
export function useIssuerClasses(wallet: string | undefined) {
  return useQuery<ClassesResponse>({
    queryKey: ['issuer-classes', wallet],
    queryFn: () => api.getPublic<ClassesResponse>(`/api/issuer-classes/by-wallet/${wallet}`),
    enabled: !!wallet,
    staleTime: 30_000,
  });
}

// Auth — educator manages their own classes (includes inactive)
export function useMyIssuerClasses() {
  return useQuery<ClassesResponse>({
    queryKey: ['issuer-classes', 'mine'],
    queryFn: () => api.get<ClassesResponse>('/api/issuer-classes/mine'),
    staleTime: 0,
  });
}

export function useCreateIssuerClass() {
  const qc = useQueryClient();
  return useMutation<IssuerClass, Error, { name: string; description?: string; topics: string[] }>({
    mutationFn: (payload) => api.post<IssuerClass>('/api/issuer-classes', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issuer-classes', 'mine'] }),
  });
}

export function useUpdateIssuerClass() {
  const qc = useQueryClient();
  return useMutation<
    IssuerClass,
    Error,
    { id: number; name?: string; description?: string; topics?: string[]; is_active?: boolean }
  >({
    mutationFn: ({ id, ...payload }) => api.patch<IssuerClass>(`/api/issuer-classes/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issuer-classes', 'mine'] }),
  });
}

export function useDeleteIssuerClass() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => api.del<void>(`/api/issuer-classes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issuer-classes', 'mine'] }),
  });
}
