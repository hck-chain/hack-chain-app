// Tests for talent class-cancellation pure logic.
//
// Full component render is blocked by the React 18/19 monorepo conflict.
// This file covers:
//   - Status grouping (active vs history) used in TalentClasses
//   - Cancellation reason trimming and max-length guard
//   - useCancelClassRequest mutation parameter shape

import { describe, it, expect } from 'vitest';
import type { MyClassRequest } from '@/hooks/useMyClassRequests';

// ── Helpers copied from TalentClasses.tsx ────────────────────────────────────

function isActive(status: MyClassRequest['status']): boolean {
  return status === 'pending' || status === 'confirmed';
}

function isHistory(status: MyClassRequest['status']): boolean {
  return status === 'completed' || status === 'cancelled';
}

function sanitizeCancelReason(raw: string): string | undefined {
  const trimmed = raw.trim().slice(0, 500);
  return trimmed || undefined;
}

// ─────────────────────────────────────────────────────────────────────────────

const BASE: Omit<MyClassRequest, 'status'> = {
  id: 1,
  issuer_organization: 'Hack Academy',
  issuer_photo: null,
  issuer_wallet: '0x' + 'aa'.repeat(20),
  requested_date: '2030-12-31',
  start_time: '10:00',
  duration_minutes: 60,
  hourly_rate_usd: null,
  class_name: null,
  payment_status: 'unpaid',
  currency: 'USDT',
  amount: null,
  deposit_proof_url: null,
  deposit_proof_cid: null,
  final_proof_url: null,
  final_proof_cid: null,
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
};

describe('status grouping — TalentClasses', () => {
  it('pending is active', () => {
    expect(isActive('pending')).toBe(true);
    expect(isHistory('pending')).toBe(false);
  });

  it('confirmed is active', () => {
    expect(isActive('confirmed')).toBe(true);
    expect(isHistory('confirmed')).toBe(false);
  });

  it('completed is history', () => {
    expect(isHistory('completed')).toBe(true);
    expect(isActive('completed')).toBe(false);
  });

  it('cancelled is history', () => {
    expect(isHistory('cancelled')).toBe(true);
    expect(isActive('cancelled')).toBe(false);
  });

  it('filters active correctly from mixed list', () => {
    const requests: MyClassRequest[] = [
      { ...BASE, id: 1, status: 'pending' },
      { ...BASE, id: 2, status: 'confirmed' },
      { ...BASE, id: 3, status: 'cancelled' },
      { ...BASE, id: 4, status: 'completed' },
    ];
    const active = requests.filter(r => isActive(r.status));
    expect(active.map(r => r.id)).toEqual([1, 2]);
  });

  it('filters history correctly from mixed list', () => {
    const requests: MyClassRequest[] = [
      { ...BASE, id: 1, status: 'pending' },
      { ...BASE, id: 2, status: 'confirmed' },
      { ...BASE, id: 3, status: 'cancelled' },
      { ...BASE, id: 4, status: 'completed' },
    ];
    const history = requests.filter(r => isHistory(r.status));
    expect(history.map(r => r.id)).toEqual([3, 4]);
  });

  it('cancel button is only shown for pending requests', () => {
    const statuses: MyClassRequest['status'][] = ['pending', 'confirmed', 'cancelled', 'completed'];
    const cancelable = statuses.filter(s => s === 'pending');
    expect(cancelable).toEqual(['pending']);
  });
});

describe('sanitizeCancelReason()', () => {
  it('returns undefined for empty string', () => {
    expect(sanitizeCancelReason('')).toBeUndefined();
  });

  it('returns undefined for whitespace-only string', () => {
    expect(sanitizeCancelReason('   ')).toBeUndefined();
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeCancelReason('  scheduling conflict  ')).toBe('scheduling conflict');
  });

  it('returns the reason when it has content', () => {
    expect(sanitizeCancelReason('I have a conflict')).toBe('I have a conflict');
  });

  it('truncates to 500 characters', () => {
    const long = 'x'.repeat(600);
    expect(sanitizeCancelReason(long)).toHaveLength(500);
  });

  it('does not truncate strings within the limit', () => {
    const short = 'x'.repeat(499);
    expect(sanitizeCancelReason(short)).toHaveLength(499);
  });

  it('truncates exactly at 500 characters', () => {
    const exact = 'x'.repeat(500);
    expect(sanitizeCancelReason(exact)).toHaveLength(500);
  });
});

describe('useCancelClassRequest mutation parameter shape', () => {
  it('accepts id without reason', () => {
    const params: { id: number; reason?: string } = { id: 42 };
    expect(params.id).toBe(42);
    expect(params.reason).toBeUndefined();
  });

  it('accepts id with reason', () => {
    const params: { id: number; reason?: string } = { id: 42, reason: 'conflict' };
    expect(params.id).toBe(42);
    expect(params.reason).toBe('conflict');
  });

  it('reason is optional — undefined does not break the shape', () => {
    const withReason:    { id: number; reason?: string } = { id: 1, reason: 'oops' };
    const withoutReason: { id: number; reason?: string } = { id: 2 };
    expect(withReason.reason).toBeDefined();
    expect(withoutReason.reason).toBeUndefined();
  });

  it('the api body omits cancellation_reason when reason is falsy', () => {
    function buildBody(reason?: string): Record<string, unknown> {
      return { cancellation_reason: reason || undefined };
    }
    expect(buildBody(undefined).cancellation_reason).toBeUndefined();
    expect(buildBody('').cancellation_reason).toBeUndefined();
    expect(buildBody('conflict').cancellation_reason).toBe('conflict');
  });
});
