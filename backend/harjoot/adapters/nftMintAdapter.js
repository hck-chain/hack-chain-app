// backend/harjoot/adapters/nftMintAdapter.js
//
// On-chain mint adapter for the HackCertificate ERC-721. Mirrors the
// polygonProvider pattern: a thin port surface plus a real ethers v6
// implementation and an in-process mock for tests.
//
// Port:
//   mintCertificate({ studentWallet, studentName, courseName, tokenUri })
//     -> Promise<{ tokenId: bigint, txHash: string }>
//
// The contract signature (HackCertificate.sol) is
//   issueCertificate(address to, string studentName, string courseName, string tokenUri)
// gated by `onlyAuthorizedIssuer`. The backend's owner wallet is the
// authorized issuer that signs every certificate mint on behalf of
// educators — educators NEVER hold the contract's signing key.
//
// The tokenId is returned on-chain from the function, but JSON-RPC
// receipts do not surface return values; we recover the id by parsing
// the `CertificateIssued(uint256 tokenId, address indexed issuer,
// address indexed student)` event from the receipt's logs.
//
// Selection: CHAIN_USE_MOCK reuses the polygonProvider switch. If chain
// reads are mocked, chain writes should be too — keeping them coupled
// avoids "we verified a real payment but persisted a fake mint" classes
// of bug.

const LOG_PREFIX = "[nftMintAdapter]";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

class NftMintError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "NftMintError";
    if (cause) this.cause = cause;
  }
}

// Minimal ABI: only the function we call + the event we read. Pulling the
// full contract ABI would couple this module to compilation artifacts we
// don't need.
const CONTRACT_ABI = [
  "function issueCertificate(address to, string studentName, string courseName, string tokenUri) external returns (uint256)",
  "event CertificateIssued(uint256 tokenId, address indexed issuer, address indexed student)",
];

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

function assertMintParams({ studentWallet, studentName, courseName, tokenUri }) {
  if (typeof studentWallet !== "string" || !WALLET_REGEX.test(studentWallet)) {
    throw new TypeError("mintCertificate requires a 0x-prefixed studentWallet");
  }
  if (!studentName || typeof studentName !== "string") {
    throw new TypeError("mintCertificate requires a non-empty studentName");
  }
  if (!courseName || typeof courseName !== "string") {
    throw new TypeError("mintCertificate requires a non-empty courseName");
  }
  if (!tokenUri || typeof tokenUri !== "string") {
    throw new TypeError("mintCertificate requires a non-empty tokenUri");
  }
}

// ---------------------------------------------------------------------------
// Real adapter — ethers v6 Contract + Wallet
// ---------------------------------------------------------------------------

/**
 * @param {{ rpcUrl: string, privateKey: string, contractAddress: string }} opts
 */
function createRealAdapter({ rpcUrl, privateKey, contractAddress }) {
  if (!rpcUrl)          throw new TypeError("createRealAdapter requires { rpcUrl }");
  if (!privateKey)      throw new TypeError("createRealAdapter requires { privateKey }");
  if (!contractAddress) throw new TypeError("createRealAdapter requires { contractAddress }");

  const { JsonRpcProvider, Wallet, Contract, Interface } = require("ethers");
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet   = new Wallet(privateKey, provider);
  const contract = new Contract(contractAddress, CONTRACT_ABI, wallet);

  // Cached Interface for log parsing — receipt logs are NOT auto-decoded
  // when we send a write transaction, so we walk receipt.logs ourselves.
  const iface = new Interface(CONTRACT_ABI);
  const issuedTopic0 = iface.getEvent("CertificateIssued").topicHash;

  return {
    async mintCertificate(params) {
      assertMintParams(params);
      const { studentWallet, studentName, courseName, tokenUri } = params;

      let receipt;
      try {
        const tx = await contract.issueCertificate(studentWallet, studentName, courseName, tokenUri);
        receipt = await tx.wait();
      } catch (err) {
        throw new NftMintError(
          `issueCertificate failed for student=${studentWallet}: ${err.message || err}`,
          err,
        );
      }

      if (!receipt || Number(receipt.status) !== 1) {
        throw new NftMintError(
          `issueCertificate tx reverted (status=${receipt && receipt.status})`,
        );
      }

      // Find the CertificateIssued event emitted by OUR contract address.
      const log = (receipt.logs || []).find((l) => {
        if (!l || !l.address || !Array.isArray(l.topics)) return false;
        if (l.address.toLowerCase() !== contractAddress.toLowerCase()) return false;
        return l.topics[0] === issuedTopic0;
      });
      if (!log) {
        throw new NftMintError(
          "issueCertificate succeeded on-chain but no CertificateIssued event was found in the receipt",
        );
      }

      let parsed;
      try {
        parsed = iface.parseLog({ topics: log.topics, data: log.data });
      } catch (err) {
        throw new NftMintError("Failed to decode CertificateIssued event", err);
      }

      const tokenId = BigInt(parsed.args.tokenId);
      const txHash  = receipt.hash || receipt.transactionHash;
      console.log(`${LOG_PREFIX} minted tokenId=${tokenId} tx=${txHash} student=${studentWallet}`);
      return { tokenId, txHash };
    },
  };
}

// ---------------------------------------------------------------------------
// Mock adapter — for tests and offline dev
// ---------------------------------------------------------------------------

/**
 * In-process mock. FIFO queue of canned responses; each successful call
 * consumes one entry. If the queue is empty, returns a deterministic
 * default so tests that don't care about the exact id don't have to
 * preload anything.
 */
function createMockAdapter() {
  const queue = []; // { type: "ok", tokenId, txHash } | { type: "error", value }
  let autoTokenId = 1000n;

  return {
    async mintCertificate(params) {
      assertMintParams(params);
      const next = queue.shift();
      if (next && next.type === "error") throw next.value;
      if (next && next.type === "ok") return { tokenId: next.tokenId, txHash: next.txHash };
      // Auto-generated default. Increments so back-to-back calls produce
      // distinct ids; keeps tests that mint several certs realistic.
      autoTokenId += 1n;
      return {
        tokenId: autoTokenId,
        txHash: "0x" + autoTokenId.toString(16).padStart(64, "0"),
      };
    },

    __setNextResult({ tokenId, txHash }) {
      if (typeof tokenId !== "bigint") throw new TypeError("tokenId must be bigint");
      if (typeof txHash !== "string")  throw new TypeError("txHash must be string");
      queue.push({ type: "ok", tokenId, txHash });
    },
    __setNextError(err) {
      queue.push({ type: "error", value: err });
    },
    __reset() {
      queue.length = 0;
      autoTokenId = 1000n;
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
 * Lazy singleton. Mirrors polygonProvider — env is not validated until
 * first call, so importing this module is safe in mock-only environments.
 */
function createNftMintAdapter() {
  if (cached) return cached;

  if (isMockMode()) {
    console.log(`${LOG_PREFIX} using mock adapter (CHAIN_USE_MOCK=true)`);
    cached = createMockAdapter();
    return cached;
  }

  // Real mode — every signer var must be present; refuse to silently
  // degrade. Naming intentionally matches services/authorizeIssuer.js
  // so a single owner wallet handles both authorize and mint.
  const rpcUrl          = process.env.POLYGON_RPC_URL;
  const privateKey      = process.env.POLYGON_OWNER_PRIVATE_KEY;
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;

  if (!rpcUrl) {
    throw new NftMintError(
      "POLYGON_RPC_URL is required (or set CHAIN_USE_MOCK=true)",
    );
  }
  if (!privateKey) {
    throw new NftMintError(
      "POLYGON_OWNER_PRIVATE_KEY is required (or set CHAIN_USE_MOCK=true)",
    );
  }
  if (!contractAddress) {
    throw new NftMintError(
      "VITE_CONTRACT_ADDRESS is required (or set CHAIN_USE_MOCK=true)",
    );
  }

  cached = createRealAdapter({ rpcUrl, privateKey, contractAddress });
  return cached;
}

function __resetForTests() {
  cached = null;
}

module.exports = {
  createNftMintAdapter,
  createRealAdapter,
  createMockAdapter,
  NftMintError,
  __resetForTests,
};
