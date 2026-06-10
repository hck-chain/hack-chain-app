import { api } from './api';

export type ReferralStatus =
  | 'pending_stake'
  | 'staking'
  | 'eligible'
  | 'queued_next_month'
  | 'claimed'
  | 'cancelled';

export interface ReferralRow {
  id: number;
  referredName: string;
  status: ReferralStatus;
  progressDays: number;
  payoutTxHash: string | null;
  createdAt: string;
}

export interface MyCode {
  code: string;
  shareUrl: string;
}

export interface ReferralStats {
  totalEarnedWei: string;
  claimedCount: number;
  pendingCount: number;
  eligibleCount: number;
  monthlyClaimedCount: number;
  monthlyCapRemaining: number;
}

export interface ValidateResult {
  valid: boolean;
  referrerName?: string;
  error?: string;
}

export interface ListReferralsResponse {
  referrals: ReferralRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  monthlyClaimedCount: number;
  monthlyCapRemaining: number;
}

export const referralsApi = {
  myCode: () => api.get<MyCode>('/api/referrals/me/code'),
  list: (page = 1, pageSize = 25) => 
    api.get<ListReferralsResponse>(`/api/referrals/me?page=${page}&pageSize=${pageSize}`),
  stats: () => api.get<ReferralStats>('/api/referrals/me/stats'),
  validate: (code: string) => api.getPublic<ValidateResult>(`/api/referrals/validate/${code}`),
};
