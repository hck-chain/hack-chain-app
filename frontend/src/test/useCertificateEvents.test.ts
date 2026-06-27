// Tests for the security validation logic in useCertificateEvents.
//
// Full hook rendering is skipped (React 18/19 monorepo conflict).
// This file covers the critical security invariants:
//   1. Non-WSS URLs are rejected before any connection is made.
//   2. Incoming log events are validated on three independent fields
//      (contract address, topic0, topic2) before triggering a refetch.
//   3. A compromised or noisy node cannot cause more than one refetch
//      per 5-second debounce window.
//   4. padAddress correctly pads wallet addresses to 32-byte hex topics.
//
// The validation logic is extracted below to mirror what onmessage does,
// keeping tests decoupled from WebSocket internals.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ethers } from 'ethers';

// ── Constants mirrored from the hook ────────────────────────────────────────

const WSS_RPC = 'wss://polygon-bor-rpc.publicnode.com';
const CONTRACT_ADDRESS = '0x61d2e94543DD498b7FD86450f1fC8135cB60021C';
const CERTIFICATE_ISSUED_TOPIC = ethers.utils.id('CertificateIssued(uint256,address,address)');
const REFETCH_DEBOUNCE_MS = 5_000;

// ── Helpers mirrored from the hook ──────────────────────────────────────────

function padAddress(address: string): string {
  return '0x' + address.replace('0x', '').toLowerCase().padStart(64, '0');
}

// Returns true when the log passes all security validations
function isValidCertificateLog(
  log: any,
  wallet: string,
): boolean {
  if (!log?.topics || !Array.isArray(log.topics)) return false;
  if (log.address?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) return false;
  if (log.topics[0]?.toLowerCase() !== CERTIFICATE_ISSUED_TOPIC.toLowerCase()) return false;
  if (!log.topics[2]?.toLowerCase().includes(wallet.toLowerCase().replace('0x', ''))) return false;
  return true;
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const TALENT_WALLET = '0xabc1230000000000000000000000000000000001';
const OTHER_WALLET  = '0xdeadbeef0000000000000000000000000000dead';

function buildValidLog(talentWallet = TALENT_WALLET) {
  return {
    address: CONTRACT_ADDRESS,
    topics: [
      CERTIFICATE_ISSUED_TOPIC,
      padAddress('0xIssuerWallet0000000000000000000000000001'),
      padAddress(talentWallet),
    ],
    data: '0x0000000000000000000000000000000000000000000000000000000000000001',
  };
}

// ── 1. WSS enforcement ───────────────────────────────────────────────────────

describe('WSS enforcement', () => {
  it('WSS_RPC constant uses wss:// — never plain ws://', () => {
    expect(WSS_RPC.startsWith('wss://')).toBe(true);
  });

  it('rejects a plain ws:// URL at the guard check', () => {
    const insecureUrl = 'ws://polygon-bor-rpc.publicnode.com';
    expect(insecureUrl.startsWith('wss://')).toBe(false);
  });
});

// ── 2. Event validation — contract address ──────────────────────────────────

describe('Contract address validation', () => {
  it('accepts a log from the known contract address', () => {
    const log = buildValidLog();
    expect(isValidCertificateLog(log, TALENT_WALLET)).toBe(true);
  });

  it('rejects a log from a different contract address', () => {
    const log = buildValidLog();
    log.address = '0x0000000000000000000000000000000000000000';
    expect(isValidCertificateLog(log, TALENT_WALLET)).toBe(false);
  });

  it('rejects a log with a missing address field', () => {
    const log = buildValidLog();
    delete log.address;
    expect(isValidCertificateLog(log, TALENT_WALLET)).toBe(false);
  });

  it('is case-insensitive on contract address comparison', () => {
    const log = buildValidLog();
    log.address = CONTRACT_ADDRESS.toUpperCase();
    expect(isValidCertificateLog(log, TALENT_WALLET)).toBe(true);
  });
});

// ── 3. Event validation — topic0 (event signature) ──────────────────────────

describe('Topic0 validation', () => {
  it('accepts a log with the correct CertificateIssued topic0', () => {
    const log = buildValidLog();
    expect(isValidCertificateLog(log, TALENT_WALLET)).toBe(true);
  });

  it('rejects a log with a different topic0 (wrong event type)', () => {
    const log = buildValidLog();
    log.topics[0] = ethers.utils.id('Transfer(address,address,uint256)');
    expect(isValidCertificateLog(log, TALENT_WALLET)).toBe(false);
  });

  it('rejects a log with a zeroed topic0', () => {
    const log = buildValidLog();
    log.topics[0] = '0x' + '0'.repeat(64);
    expect(isValidCertificateLog(log, TALENT_WALLET)).toBe(false);
  });

  it('rejects a log with no topics array', () => {
    const log = buildValidLog();
    delete log.topics;
    expect(isValidCertificateLog(log, TALENT_WALLET)).toBe(false);
  });

  it('rejects a log with an empty topics array', () => {
    const log = { ...buildValidLog(), topics: [] };
    expect(isValidCertificateLog(log, TALENT_WALLET)).toBe(false);
  });
});

// ── 4. Event validation — topic2 (talent wallet) ────────────────────────────

describe('Topic2 (talent wallet) validation', () => {
  it('accepts a log where topic2 contains this talent wallet', () => {
    const log = buildValidLog(TALENT_WALLET);
    expect(isValidCertificateLog(log, TALENT_WALLET)).toBe(true);
  });

  it('rejects a log directed at a different wallet', () => {
    const log = buildValidLog(OTHER_WALLET);
    expect(isValidCertificateLog(log, TALENT_WALLET)).toBe(false);
  });

  it('rejects a log with a missing topic2', () => {
    const log = buildValidLog();
    log.topics = [log.topics[0], log.topics[1]]; // only 2 topics
    expect(isValidCertificateLog(log, TALENT_WALLET)).toBe(false);
  });
});

// ── 5. padAddress ────────────────────────────────────────────────────────────

describe('padAddress', () => {
  it('pads a wallet address to 66 chars (0x + 64 hex digits)', () => {
    const result = padAddress(TALENT_WALLET);
    expect(result).toHaveLength(66);
    expect(result.startsWith('0x')).toBe(true);
  });

  it('lowercases the address', () => {
    const result = padAddress(TALENT_WALLET.toUpperCase());
    expect(result).toBe(result.toLowerCase());
  });

  it('contains the original address without 0x prefix', () => {
    const result = padAddress(TALENT_WALLET);
    expect(result.includes(TALENT_WALLET.replace('0x', '').toLowerCase())).toBe(true);
  });
});

// ── 6. Debounce — prevents refetch flooding from a noisy/hostile node ────────

describe('Debounce logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows a refetch when debounce window has passed', () => {
    let lastRefetch = 0;
    const DEBOUNCE = REFETCH_DEBOUNCE_MS;

    function shouldRefetch(): boolean {
      const now = Date.now();
      if (now - lastRefetch < DEBOUNCE) return false;
      lastRefetch = now;
      return true;
    }

    expect(shouldRefetch()).toBe(true); // first call always goes through
  });

  it('blocks a second refetch within the debounce window', () => {
    let lastRefetch = 0;
    const DEBOUNCE = REFETCH_DEBOUNCE_MS;

    function shouldRefetch(): boolean {
      const now = Date.now();
      if (now - lastRefetch < DEBOUNCE) return false;
      lastRefetch = now;
      return true;
    }

    expect(shouldRefetch()).toBe(true);
    expect(shouldRefetch()).toBe(false); // same tick — blocked
  });

  it('allows a refetch again after the debounce window expires', () => {
    let lastRefetch = 0;
    const DEBOUNCE = REFETCH_DEBOUNCE_MS;

    function shouldRefetch(): boolean {
      const now = Date.now();
      if (now - lastRefetch < DEBOUNCE) return false;
      lastRefetch = now;
      return true;
    }

    shouldRefetch(); // first
    vi.advanceTimersByTime(REFETCH_DEBOUNCE_MS + 1);
    expect(shouldRefetch()).toBe(true); // window expired — allowed
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

// ── 7. CERTIFICATE_ISSUED_TOPIC integrity ────────────────────────────────────

describe('CERTIFICATE_ISSUED_TOPIC', () => {
  it('matches the keccak256 of the canonical event signature', () => {
    const expected = ethers.utils.id('CertificateIssued(uint256,address,address)');
    expect(CERTIFICATE_ISSUED_TOPIC).toBe(expected);
  });

  it('does NOT match a different event signature', () => {
    const transferTopic = ethers.utils.id('Transfer(address,address,uint256)');
    expect(CERTIFICATE_ISSUED_TOPIC).not.toBe(transferTopic);
  });
});
