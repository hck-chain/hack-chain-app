import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface EducatorApprovalStatus {
  status: 'pending_approval' | 'approved' | 'rejected';
  reason?: string;
  approved_at?: string;
}

export function useEducatorApprovalStatus() {
  return useQuery({
    queryKey: ['educator-approval-status'],
    queryFn: () => api.get<EducatorApprovalStatus>('/api/issuers/me/status'),
    staleTime: 30_000,
    retry: 1,
  });
}
