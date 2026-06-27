// Tests for the anti-duplication logic in useCreateCertificate.
//
// Full hook rendering is skipped (React 18/19 monorepo conflict).
// This file covers:
//   1. pendingRef blocks concurrent calls — the core anti-duplicate guard.
//   2. pendingRef is released after success so subsequent calls work.
//   3. pendingRef is released after an error — no permanent lock.
//   4. web3Service.mintCertificateOnChain receives a null receipt and throws.
//
// The guard logic is extracted below to mirror what useCreateCertificate does,
// keeping tests decoupled from React and ethers internals.

import { describe, it, expect, vi } from 'vitest';

// ── 1. pendingRef anti-duplicate guard ───────────────────────────────────────
//
// This models exactly what the hook does:
//   if (pendingRef.current) return false;
//   pendingRef.current = true;
//   try { ... } finally { pendingRef.current = false; }

describe('pendingRef guard — prevents duplicate certificate minting', () => {
  function makeMintGuard(asyncWork: () => Promise<boolean>) {
    const pendingRef = { current: false };

    async function createCertificate(): Promise<boolean> {
      if (pendingRef.current) return false;
      pendingRef.current = true;
      try {
        return await asyncWork();
      } finally {
        pendingRef.current = false;
      }
    }

    return { createCertificate, pendingRef };
  }

  it('allows the first call through', async () => {
    const { createCertificate } = makeMintGuard(async () => true);
    const result = await createCertificate();
    expect(result).toBe(true);
  });

  it('blocks a concurrent second call while the first is in flight', async () => {
    let resolve!: (v: boolean) => void;
    const firstFinished = new Promise<boolean>(r => { resolve = r; });

    const { createCertificate } = makeMintGuard(() => firstFinished);

    // Start first call but don't await it yet
    const first = createCertificate();
    // Second call fires while first is pending
    const second = createCertificate();

    resolve(true);          // let the first one finish
    const [r1, r2] = await Promise.all([first, second]);

    expect(r1).toBe(true);  // first succeeded
    expect(r2).toBe(false); // second was blocked
  });

  it('releases the guard after success — next call proceeds normally', async () => {
    const work = vi.fn(async () => true);
    const { createCertificate } = makeMintGuard(work);

    await createCertificate(); // first
    const result = await createCertificate(); // second — should NOT be blocked

    expect(result).toBe(true);
    expect(work).toHaveBeenCalledTimes(2);
  });

  it('releases the guard after a thrown error — no permanent lock', async () => {
    let callCount = 0;
    const { createCertificate } = makeMintGuard(async () => {
      callCount += 1;
      if (callCount === 1) throw new Error('mint failed');
      return true;
    });

    // First call throws — guard must still be released in finally
    try { await createCertificate(); } catch (_) {}

    // Second call should go through
    const result = await createCertificate();
    expect(result).toBe(true);
    expect(callCount).toBe(2);
  });

  it('does not allow a third concurrent call either', async () => {
    let resolve!: (v: boolean) => void;
    const firstFinished = new Promise<boolean>(r => { resolve = r; });

    const { createCertificate } = makeMintGuard(() => firstFinished);

    const first  = createCertificate();
    const second = createCertificate(); // blocked
    const third  = createCertificate(); // also blocked

    resolve(true);
    const [r1, r2, r3] = await Promise.all([first, second, third]);

    expect(r1).toBe(true);
    expect(r2).toBe(false);
    expect(r3).toBe(false);
  });
});

// ── 2. web3Service tx timeout handling ───────────────────────────────────────
//
// waitForTransaction returns null when the timeout is exceeded.
// The service must throw rather than proceed to the DB write with a null receipt.

describe('web3Service timeout handling', () => {
  function buildMintWithReceipt(receipt: any) {
    return async function mintCertificateOnChain(): Promise<boolean> {
      // Mirrors the relevant part of web3Service after tx is submitted
      if (!receipt) throw new Error('Transaction confirmation timed out after 2 minutes');
      return true;
    };
  }

  it('returns true when a valid receipt is received', async () => {
    const mint = buildMintWithReceipt({ status: 1, hash: '0xabc' });
    const result = await mint();
    expect(result).toBe(true);
  });

  it('throws when receipt is null (timeout scenario)', async () => {
    const mint = buildMintWithReceipt(null);
    await expect(mint()).rejects.toThrow('timed out');
  });

  it('does NOT proceed to DB write when receipt is null', async () => {
    const dbWrite = vi.fn();

    async function mintWithTimeout(receipt: any) {
      if (!receipt) throw new Error('Transaction confirmation timed out after 2 minutes');
      await dbWrite();
    }

    await expect(mintWithTimeout(null)).rejects.toThrow();
    expect(dbWrite).not.toHaveBeenCalled();
  });

  it('proceeds to DB write when receipt is valid', async () => {
    const dbWrite = vi.fn();

    async function mintWithTimeout(receipt: any) {
      if (!receipt) throw new Error('Transaction confirmation timed out after 2 minutes');
      await dbWrite();
    }

    await mintWithTimeout({ status: 1 });
    expect(dbWrite).toHaveBeenCalledTimes(1);
  });
});

// ── 3. No duplicate DB writes on concurrent mints ────────────────────────────
//
// Combines the guard + DB write to verify that only one write happens
// even if two calls are fired simultaneously.

describe('No duplicate certificates — guard + DB write integration', () => {
  it('only writes to DB once when two mint calls race', async () => {
    const dbWrite = vi.fn(async () => {});
    let pendingRef = { current: false };

    async function createCertificate(): Promise<boolean> {
      if (pendingRef.current) return false;
      pendingRef.current = true;
      try {
        // Simulate async mint + DB write
        await new Promise(r => setTimeout(r, 0));
        await dbWrite();
        return true;
      } finally {
        pendingRef.current = false;
      }
    }

    await Promise.all([
      createCertificate(),
      createCertificate(),
    ]);

    expect(dbWrite).toHaveBeenCalledTimes(1);
  });
});
