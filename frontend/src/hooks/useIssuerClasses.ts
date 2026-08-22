import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { IssuerClass } from '@/types/dashboard';

interface ClassesResponse {
  classes: IssuerClass[];
}

// EDUCATOR_NOT_APPROVED is a raw error code from the backend (not human-readable) —
// map it to a friendly message, fall back to whatever the API sent otherwise.
function useCatalogMutationErrorToast() {
  const { toast } = useToast();
  const { t } = useTranslation();
  return (error: Error) => {
    const description =
      error.message === 'EDUCATOR_NOT_APPROVED'
        ? t('editClasses.approvalRequiredError')
        : error.message || t('editClasses.errorTitle');
    toast({ title: t('editClasses.errorTitle'), description, variant: 'destructive' });
  };
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
  const onError = useCatalogMutationErrorToast();
  return useMutation<IssuerClass, Error, { name: string; description?: string; topics: string[] }>({
    mutationFn: (payload) => api.post<IssuerClass>('/api/issuer-classes', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issuer-classes', 'mine'] }),
    onError,
  });
}

export function useUpdateIssuerClass() {
  const qc = useQueryClient();
  const onError = useCatalogMutationErrorToast();
  return useMutation<
    IssuerClass,
    Error,
    { id: number; name?: string; description?: string; topics?: string[]; is_active?: boolean }
  >({
    mutationFn: ({ id, ...payload }) => api.patch<IssuerClass>(`/api/issuer-classes/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issuer-classes', 'mine'] }),
    onError,
  });
}

export function useDeleteIssuerClass() {
  const qc = useQueryClient();
  const onError = useCatalogMutationErrorToast();
  return useMutation<void, Error, number>({
    mutationFn: (id) => api.del<void>(`/api/issuer-classes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issuer-classes', 'mine'] }),
    onError,
  });
}
