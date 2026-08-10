import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

interface ExchangeRateResponse {
  rate: number;
  updated_at: string;
}

export function useExchangeRate() {
  return useQuery({
    queryKey: ['exchange-rate', 'usd-mxn'],
    queryFn: () => api.getPublic<ExchangeRateResponse>('/api/exchange-rate/usd-mxn'),
    staleTime: 30 * 60_000,
    retry: 1,
  });
}
