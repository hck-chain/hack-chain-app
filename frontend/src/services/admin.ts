// frontend/src/services/admin.ts
//
// Typed wrappers around the /api/admin/* endpoints implemented in Phase A
// of the admin dashboard work. Each function maps cleanly onto one
// endpoint and returns the typed payload — TanStack Query hooks consume
// these directly.
//
// All endpoints require the caller to be authenticated AND in the
// configured ADMIN_WALLETS env on the backend. The api helper handles
// the cookie + refresh dance.

import { api } from './api';

// ---------------------------------------------------------------------------
// Shared shapes
// ---------------------------------------------------------------------------

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type EducatorStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected';

export type EducatorRow = {
  id: number;
  walletAddress: string;
  name: string | null;
  lastname: string | null;
  email: string | null;
  organizationName: string | null;
  status: EducatorStatus | string;
  approvedAt: string | null;
  approvedBy: number | null;
  rejectionReason: string | null;
  createdAt: string;
};

export type AdminStats = {
  educators: { pending: number; approved: number; rejected: number; total: number };
  certificates: { today: number; last_7_days: number; total: number };
  revenue: { gross_usd: string; harjoot_cost_usd: string; margin_usd: string };
  treasury: {
    pending: number;
    awaiting_manual_conversion: number;
    sent: number;
    failed: number;
    outstanding_debt_usd: string;
  };
  generated_at: string;
};

export type PaymentDisputeRow = {
  id: number;
  class_request_id: number;
  dispute_type: 'deposit' | 'final';
  status: 'open' | 'resolved_paid' | 'resolved_unpaid';
  opened_by_wallet: string;
  resolution_note: string | null;
  resolved_by_wallet: string | null;
  resolved_at: string | null;
  created_at: string;
  classRequest: {
    id: number;
    class_name: string | null;
    student_wallet_address: string;
    issuer_wallet_address: string;
    currency: string;
    amount: string | null;
    payment_network: string | null;
    deposit_proof_url: string | null;
    deposit_proof_cid: string | null;
    final_proof_url: string | null;
    final_proof_cid: string | null;
  } | null;
};

export type PaymentRow = {
  id: number;
  txHash: string;
  fromWallet: string;
  amountHack: string; // BIGINT as string
  harjootPriceUsd: string;
  userPriceUsd: string;
  status: string;
  purpose: string;
  createdAt: string;
  certificate: {
    id: number;
    title: string | null;
    tokenId: string | null;
    harjootVerificationId: string | null;
    status: string | null;
  } | null;
};

export type TreasuryStatus =
  | 'pending'
  | 'awaiting_manual_conversion'
  | 'sent'
  | 'sent_but_not_notified'
  | 'failed';

export type TreasuryRow = {
  id: number;
  paymentId: number;
  amountUsdtOwed: string;
  destination: string;
  status: TreasuryStatus | string;
  usdtTxHash: string | null;
  error: string | null;
  createdAt: string;
  sentAt: string | null;
  payment: {
    id: number;
    txHash: string;
    fromWallet: string;
    amountHack: string;
    userPriceUsd: string;
    harjootPriceUsd: string;
  } | null;
};

// ---------------------------------------------------------------------------
// Query-string builder — null/undefined fields are dropped so backend
// validators don't see "?from=undefined".
// ---------------------------------------------------------------------------

function qs(params: Record<string, string | number | undefined | null>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  const search = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
  return `?${search.toString()}`;
}

// ---------------------------------------------------------------------------
// Educators
// ---------------------------------------------------------------------------

export type ListEducatorsParams = {
  status?: 'pending_approval' | 'approved' | 'rejected' | 'all';
  search?: string;
  page?: number;
  limit?: number;
};


// ---------------------------------------------------------------------------
// Preventa de HACK
// ---------------------------------------------------------------------------

export type PresaleStatus = 'pending' | 'validated' | 'rejected';

/** Motivos que devuelve la verificacion en cadena (usecases/presale/verifyContribution). */
export type PresaleVerificationReason =
  | 'NO_TX_HASH' | 'TX_NOT_FOUND' | 'TX_REVERTED' | 'NO_USDT_TRANSFER'
  | 'WRONG_RECIPIENT' | 'WRONG_SENDER' | 'BELOW_MINIMUM' | 'OUTSIDE_PHASE'
  | 'NOT_ENOUGH_CONFIRMATIONS' | 'RPC_ERROR'
  // Solo en la exportacion: lo guardado no coincide con lo que respalda el pago.
  | 'PHASE_MISMATCH' | 'AMOUNT_MISMATCH';

// Un solo tipo con campos opcionales y no una union discriminada por `ok`:
// con `strict: false` (tsconfig del proyecto) TypeScript no estrecha la union.
export type PresaleVerification = {
  ok: boolean;
  /** Lo que se movio en cadena (ok, o WRONG_SENDER con revision manual posible). */
  amountUsdt?: number;
  txHash?: string;
  /** Lo que se ACREDITA: fase por la fecha del bloque, HACK por lo transferido. */
  phaseId?: number;
  phaseLabel?: string;
  hackAmount?: string;
  blockTime?: string;
  /** Quien envio el USDT a la tesoreria. */
  senders?: string[];
  /** Se valido aceptando otro remitente (pago desde un exchange). */
  manualReview?: boolean;
  /** Presente si !ok. */
  reason?: PresaleVerificationReason;
  /** WRONG_SENDER: el pago llego, desde otra direccion; se puede validar con nota. */
  manualReviewPossible?: boolean;
  soft_failed?: boolean;
  /** NOT_ENOUGH_CONFIRMATIONS */
  confirmations?: number;
  required?: number;
  error?: string;
};

export type PresaleContributionRow = {
  id: number;
  wallet_address: string;
  phase_id: number;
  usdt_amount: string;
  hack_amount: string;
  tx_hash: string | null;
  proof_cid: string | null;
  proof_uri: string | null;
  status: PresaleStatus;
  rejection_reason: string | null;
  validated_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  onchain_amount_usdt: string | null;
  /** Lo que declaro el comprador; phase_id y hack_amount son lo acreditado. */
  declared_phase_id: number | null;
  declared_hack_amount: string | null;
  payment_block_time: string | null;
  payment_sender: string | null;
  manual_review_note: string | null;
  created_at: string;
};

export type PresaleContributionsPage = {
  contributions: PresaleContributionRow[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  counts: Record<PresaleStatus, number>;
};

export type PresaleExport = {
  ok: true;
  csv: string;
  hash: string;
  rows: Array<{ address: string; wei: string; hack: string; contributions: number }>;
  totals: { wallets: number; contributions: number; hack: string; wei: string };
  /** El lote partido para cargar: una transaccion de allocateBatch por tanda. */
  batches: Array<{ index: number; wallets: number; csv: string }>;
  batchSize: number;
};

/** Filas que impidieron exportar: aporte validado que ya no se sostiene en cadena. */
export type PresaleExportProblem = {
  id: number;
  wallet_address: string;
  tx_hash: string | null;
  reason: PresaleVerificationReason;
};


/** Estado de una tanda del lote en el contrato. */
export type PresaleBatchState = 'loaded' | 'not_loaded' | 'partial' | 'over';

// Un solo tipo con opcionales (no union discriminada): con `strict: false`
// TypeScript no estrecha por `configured`.
export type PresaleContractStatus = {
  configured: boolean;
  /** Presente si !configured. */
  detail?: string;
  contract?: string;
  review?: { pending: number };
  onchain?: {
    totalAllocated: string;
    totalAllocatedHack: string;
    totalClaimedHack: string;
    beneficiaryCount: number;
    presaleCapHack: string;
    balanceHack: string;
    allocationListHash: string | null;
    finalized: boolean;
    paused: boolean;
    vestingStart: string | null;
    claimFrom: string | null;
  };
  funding?: { state: 'ok' | 'short'; missingHack?: string };
  batch?: {
    hash: string;
    wallets: number;
    hack: string;
    batchSize: number;
    batches: Array<{ index: number; wallets: number; state: PresaleBatchState; loadedWallets: number }>;
    problems: Array<{ address: string; state: 'over' | 'partial'; expectedHack: string; onchainHack: string }>;
  } | null;
  checks?: {
    totals: 'match' | 'below' | 'above';
    unknownBeneficiaries: number;
    hash: 'unset' | 'match' | 'mismatch';
  } | null;
};

/** Una red de la preventa, tal como esta en backend/config/presale.js. */
export type PresaleNetwork = {
  role: 'payment' | 'token';
  description: string;
  network: string;
  chainId: number;
  explorer: string;
  treasury?: string | null;
  multisig?: string | null;
  presaleContract?: string | null;
  token?: { symbol: string; address: string; decimals: number };
  rpcEnv: string;
};

export type PresaleAdminConfig = {
  networks: PresaleNetwork[];
  /** Valores del archivo reemplazados por variables de entorno (pruebas). */
  overrides: Array<{ role: string; field: string; env: string; fileValue: string | null; value: string }>;
  /** Direcciones todavia sin definir. */
  pending: Array<{ role: string; field: string }>;
  phases: Array<{
    id: number; label: string; priceUsdt: string; start: string; end: string;
    capHack: string; soldHack: string; availableHack: string;
  }>;
  phasesOverridden: boolean;
};

export const adminApi = {
  listEducators(params: ListEducatorsParams = {}): Promise<Paginated<EducatorRow>> {
    return api.get(`/api/admin/educators${qs(params)}`);
  },

  approveEducator(userId: number): Promise<{ message: string; user: { id: number; status: 'approved'; approved_at: string } }> {
    return api.post(`/api/admin/educators/${userId}/approve`);
  },

  rejectEducator(userId: number, reason: string): Promise<{ message: string; user: { id: number; status: 'rejected'; reason: string } }> {
    return api.post(`/api/admin/educators/${userId}/reject`, { reason });
  },

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------

  stats(): Promise<AdminStats> {
    return api.get(`/api/admin/stats`);
  },

  // -------------------------------------------------------------------------
  // Payments
  // -------------------------------------------------------------------------

  listPayments(params: {
    from?: string;
    to?: string;
    fromWallet?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<Paginated<PaymentRow>> {
    return api.get(`/api/admin/payments${qs(params)}`);
  },

  // -------------------------------------------------------------------------
  // Treasury
  // -------------------------------------------------------------------------

  listTreasury(params: {
    status?: TreasuryStatus | 'all';
    page?: number;
    limit?: number;
  } = {}): Promise<Paginated<TreasuryRow>> {
    return api.get(`/api/admin/treasury-queue${qs(params)}`);
  },

  markTreasurySent(
    transferId: number,
    usdtTxHash: string,
  ): Promise<{ message: string; transfer: { id: number; status: 'sent'; usdtTxHash: string; sentAt: string } }> {
    return api.post(`/api/admin/treasury-queue/${transferId}/mark-sent`, { usdtTxHash });
  },

  // -------------------------------------------------------------------------
  // Class-payment disputes
  // -------------------------------------------------------------------------

  listPaymentDisputes(status: 'open' | 'resolved_paid' | 'resolved_unpaid' | 'all' = 'open'): Promise<{ disputes: PaymentDisputeRow[] }> {
    return api.get(`/api/admin/payment-disputes${qs({ status })}`);
  },

  resolvePaymentDispute(disputeId: number, wasPaid: boolean, resolutionNote?: string) {
    return api.patch(`/api/admin/payment-disputes/${disputeId}/resolve`, { was_paid: wasPaid, resolution_note: resolutionNote });
  },

  resolveCertificateFlag(certificateId: number, resolutionNote?: string) {
    return api.patch(`/api/admin/certificates/${certificateId}/resolve-flag`, { resolution_note: resolutionNote });
  },

  // -------------------------------------------------------------------------
  // Preventa
  // -------------------------------------------------------------------------

  listPresaleContributions(params: {
    status?: PresaleStatus;
    page?: number;
    per_page?: number;
    search?: string;
  } = {}): Promise<PresaleContributionsPage> {
    return api.get(`/api/admin/presale/contributions${qs(params)}`);
  },

  /** Verifica en Polygon sin cambiar nada. */
  verifyPresaleContribution(id: number): Promise<{ verification: PresaleVerification }> {
    return api.get(`/api/admin/presale/contributions/${id}/verification`);
  },

  /**
   * Re-verifica en cadena y valida solo si pasa. 422 trae { verification }.
   * `manualReviewNote`: solo para un pago que llego desde otra direccion
   * (exchange); sin ella, ese caso responde MANUAL_NOTE_REQUIRED.
   */
  validatePresaleContribution(
    id: number,
    manualReviewNote?: string,
  ): Promise<{ contribution: PresaleContributionRow; verification: PresaleVerification }> {
    return api.post(`/api/admin/presale/contributions/${id}/validate`, manualReviewNote ? { manualReviewNote } : undefined);
  },

  rejectPresaleContribution(id: number, reason: string): Promise<{ contribution: PresaleContributionRow }> {
    return api.post(`/api/admin/presale/contributions/${id}/reject`, { reason });
  },

  /** 422 trae { problems: PresaleExportProblem[] }. */
  exportPresaleBatch(): Promise<PresaleExport> {
    return api.get(`/api/admin/presale/export`);
  },

  /** Donde queda cada cosa (redes, tesoreria, contrato) y cada fase con lo vendido. */
  getPresaleConfig(): Promise<PresaleAdminConfig> {
    return api.get(`/api/admin/presale/config`);
  },

  /** Lee PresaleAllocation en cadena y lo compara con el lote. */
  getPresaleContractStatus(): Promise<PresaleContractStatus> {
    return api.get(`/api/admin/presale/contract-status`);
  },
};
