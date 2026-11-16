import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { presaleService, type ContributorsQuery } from '@/services/presale';

/**
 * Pagina del registro publico de contribuidores.
 *
 * `placeholderData: keepPreviousData` evita que la tabla parpadee en vacio
 * mientras llega la pagina siguiente o un resultado de busqueda: se queda con
 * la pagina anterior hasta que la nueva esta lista.
 */
export function usePresaleContributors(query: ContributorsQuery) {
  return useQuery({
    queryKey: ['presale-contributors', query],
    queryFn: () => presaleService.listContributors(query),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 1,
  });
}
