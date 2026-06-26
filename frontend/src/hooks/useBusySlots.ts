import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { BusySlot } from '@/lib/slots';

interface BusySlotsResponse {
  slots: BusySlot[];
}

export function useBusySlots(wallet: string | undefined) {
  return useQuery<BusySlot[]>({
    queryKey: ['busy-slots', wallet],
    queryFn: () =>
      api.get<BusySlotsResponse>(`/api/issuers/${wallet}/busy-slots`).then(r => r.slots),
    enabled: !!wallet,
    staleTime: 60_000,
  });
}
