// backend/harjoot/adapters/polygonProvider.js
//
// Thin port-adapter wrapper around ethers v6 JsonRpcProvider. The point
// of this module is NOT to abstract every RPC method ethers exposes — it
// is to give the rest of the codebase a stable, easily-mockable surface
// for the chain reads we actually do.
//
// Contract (the "port"):
//   {
//     getTransactionReceipt(txHash: string): Promise<Receipt | null>
//   }
//
// A receipt of `null` means "the transaction is unknown to the node or
// not yet mined". Callers MUST treat null as a soft failure, not a hard
// one — never crash on a missing receipt.
//
// Selection:
//   CHAIN_USE_MOCK=true  -> in-process mock provider (tests, dev without RPC).
//   otherwise            -> real ethers JsonRpcProvider pointed at
//                           process.env.POLYGON_RPC_URL.
//
// Pattern note: HARJOOT_USE_MOCK and CHAIN_USE_MOCK are intentionally
// SEPARATE flags. You may want a real Harjoot partner endpoint while
// hitting a local Anvil for chain reads, or vice versa, so we don't
// couple them.

const LOG_PREFIX = "[polygonProvider]";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

class PolygonProviderError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "PolygonProviderError";
    if (cause) this.cause = cause;
  }
}

// ---------------------------------------------------------------------------
// Real adapter — ethers v6 JsonRpcProvider
// ---------------------------------------------------------------------------

/**
 * Construct a real provider. Exported separately so tests can build one
 * against a local Anvil node without going through the singleton factory.
 *
 * @param {{ rpcUrl: string }} opts
 */
function createRealProvider({ rpcUrl }) {
  if (!rpcUrl || typeof rpcUrl !== "string") {
    throw new TypeError("createRealProvider requires { rpcUrl: string }");
  }
  // Lazy-require so the ethers cost is only paid when this branch runs.
  // Keeps test boot fast and avoids loading native deps in mock-only envs.
  const { JsonRpcProvider } = require("ethers");
  const provider = new JsonRpcProvider(rpcUrl);

  return {
    /**
     * @param {string} txHash 0x-prefixed transaction hash.
     * @returns {Promise<object | null>} ethers v6 TransactionReceipt or null.
     */
    async getTransactionReceipt(txHash) {
      try {
        return await provider.getTransactionReceipt(txHash);
      } catch (err) {
        // Network / RPC errors surface as PolygonProviderError so callers
        // can distinguish "infra is down" from "tx not found".
        throw new PolygonProviderError(
          `RPC error fetching receipt for ${txHash}: ${err.message || err}`,
          err,
        );
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Mock adapter — for tests and offline dev
// ---------------------------------------------------------------------------

/**
 * Construct an in-process mock. Returns the canned receipt set via
 * __setNextReceipt() on the next call, or throws the canned error set
 * via __setNextError(). Each call consumes its canned value, so multiple
 * call expectations require multiple sets.
 */
function createMockProvider() {
  const queue = []; // array of { type: "receipt" | "error", value }

  return {
    async getTransactionReceipt(_txHash) {
      const next = queue.shift();
      if (!next) {
        // Default: behave like a node that has never heard of this tx.
        return null;
      }
      if (next.type === "error") throw next.value;
      return next.value;
    },

    // Test helpers — prefixed with __ to mark them as internal.
    __setNextReceipt(receipt) {
      queue.push({ type: "receipt", value: receipt });
    },
    __setNextError(err) {
      queue.push({ type: "error", value: err });
    },
    __reset() {
      queue.length = 0;
    },
    __pendingCount() {
      return queue.length;
    },
  };
}

// ---------------------------------------------------------------------------
// Factory + lazy singleton
// ---------------------------------------------------------------------------

let cached = null;

function isMockMode() {
  const v = process.env.CHAIN_USE_MOCK;
  return v === "true" || v === "1";
}

/**
 * Returns a cached provider instance. Created lazily on first call so
 * importing this module does NOT validate env (mirrors the harjoot client
 * pattern at harjoot/client/index.js).
 */
function createPolygonProvider() {
  if (cached) return cached;

  if (isMockMode()) {
    console.log(`${LOG_PREFIX} using mock provider (CHAIN_USE_MOCK=true)`);
    cached = createMockProvider();
    return cached;
  }

  if (!process.env.POLYGON_RPC_URL) {
    throw new PolygonProviderError(
      "POLYGON_RPC_URL environment variable is required " +
        "(or set CHAIN_USE_MOCK=true to run against the in-process mock)",
    );
  }

  cached = createRealProvider({ rpcUrl: process.env.POLYGON_RPC_URL });
  return cached;
}

/**
 * Drop the cached singleton. Intended for tests that need to flip
 * CHAIN_USE_MOCK between cases.
 */
function __resetForTests() {
  cached = null;
}

module.exports = {
  createPolygonProvider,
  createRealProvider,
  createMockProvider,
  PolygonProviderError,
  __resetForTests,
};
