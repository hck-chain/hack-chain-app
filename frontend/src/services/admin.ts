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
};
