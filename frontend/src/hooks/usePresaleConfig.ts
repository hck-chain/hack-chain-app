import { useQuery } from '@tanstack/react-query';
import { presaleService } from '@/services/presale';

/**
 * Configuracion publica de la preventa. Es la unica fuente de la direccion
 * de pago: no hay copia en el front, asi no puede quedar desactualizada.
 */
export function usePresaleConfig() {
  return useQuery({
    queryKey: ['presale-config'],
    queryFn: presaleService.getConfig,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
