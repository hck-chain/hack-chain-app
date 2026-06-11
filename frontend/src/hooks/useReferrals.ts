import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { referralsApi } from '@/services/referrals';

export function useMyReferralCode() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['referrals', 'myCode'],
    queryFn: referralsApi.myCode,
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60_000,
  });
}

export function useMyReferrals(page = 1, pageSize = 25) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['referrals', 'list', page, pageSize],
    queryFn: () => referralsApi.list(page, pageSize),
    enabled: isAuthenticated && !authLoading,
    keepPreviousData: true,
  });
}

export function useMyReferralStats() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['referrals', 'stats'],
    queryFn: referralsApi.stats,
    enabled: isAuthenticated && !authLoading,
    refetchInterval: 60_000,
  });
}

export function useValidateReferralCode(code: string | null) {
  return useQuery({
    queryKey: ['referrals', 'validate', code],
    queryFn: () => referralsApi.validate(code as string),
    enabled: !!code && /^[0-9A-HJ-NP-TV-Z]{8}$/i.test(code),
    retry: false,
    staleTime: 10 * 60_000,
  });
}
