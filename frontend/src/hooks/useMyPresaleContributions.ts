import { useQuery } from '@tanstack/react-query';
import { presaleService } from '@/services/presale';

/** Aportes de la wallet autenticada. Solo corre con sesion abierta. */
export function useMyPresaleContributions(enabled: boolean) {
  return useQuery({
    queryKey: ['presale-my-contributions'],
    queryFn: presaleService.listMine,
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}
