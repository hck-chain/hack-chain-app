import { api } from '@/services/api';

export interface ContributorRow {
  address: string;
  phase: string;
  phase_id: number;
  usdt: number;
  hack: number;
  created_at: string;
}

export interface OwnContribution extends ContributorRow {
  id: number;
  status: 'pending' | 'validated' | 'rejected';
  tx_hash: string | null;
  proof_uri: string | null;
  rejection_reason: string | null;
  validated_at: string | null;
}

export interface ContributorsPage {
  contributors: ContributorRow[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface OwnContributions {
  contributions: OwnContribution[];
  totals: { usdt: number; hack: number; pending_count: number };
}

export interface ContributorsQuery {
  page?: number;
  perPage?: number;
  search?: string;
  phaseId?: number;
}

export interface NewContribution {
  phase_id: number;
  usdt_amount: number;
  hack_amount: number;
  tx_hash?: string | null;
  proof_cid?: string | null;
  proof_uri?: string | null;
}

export interface PresaleConfig {
  payment: {
    network: string;
    chainId: number;
    explorer: string;
    /** null mientras no este definida: la pagina no muestra ninguna. */
    treasury: string | null;
    token: { symbol: string; address: string; decimals: number };
  };
  token: { network: string; chainId: number; explorer: string; presaleContract: string | null };
  minPurchaseUsdt: number;
  phases: Array<{ id: number; label: string; priceUsdt: string; capHack: string; start: string; end: string }>;
}

export const presaleService = {
  /**
   * Configuracion publica (backend/config/presale.js): red de pago, tesoreria,
   * token, minimo y fases. La direccion de pago se muestra SIEMPRE desde aca.
   */
  getConfig() {
    return api.getPublic<PresaleConfig>('/api/presale/config');
  },

  /** Registro publico. Solo devuelve aportes ya validados. */
  listContributors({ page = 1, perPage = 10, search, phaseId }: ContributorsQuery = {}) {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (search?.trim()) params.set('search', search.trim());
    if (phaseId) params.set('phase_id', String(phaseId));
    return api.getPublic<ContributorsPage>(`/api/presale/contributors?${params}`);
  },

  /** Los aportes de la wallet de la sesion, en cualquier estado. */
  listMine() {
    return api.get<OwnContributions>('/api/presale/contributions/me');
  },

  /**
   * Sube el comprobante a Pinata via el backend.
   *
   * El archivo no se guarda en el servidor: viaja de la memoria del proceso
   * directo a IPFS y lo unico que vuelve (y lo unico que persistimos) es el
   * CID. Requiere sesion: el endpoint corre detras de `authenticate`.
   */
  uploadProof(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<{ cid: string; uri: string }>('/api/upload/payment-proof', formData);
  },

  register(contribution: NewContribution) {
    return api.post<OwnContribution>('/api/presale/contributions', contribution);
  },
};
