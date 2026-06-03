// backend/harjoot/client/mockClient.js
//
// In-process Harjoot client stub. Two purposes:
//
//   1. Server mode — when HARJOOT_USE_MOCK=true, the backend can run end-to-end
//      without the real partner API. Every method resolves with a well-formed
//      response that matches the shape documented in client-integration-guide.pdf
//      and hackchain-harjoot-integration-gaps.pdf.
//
//   2. Test mode — the returned client exposes underscore-prefixed helpers
//      (__calls, __setNextResponse, __setNextError, __reset) that let unit
//      tests assert what was called and force specific outcomes per call.
//
// This stub matches the surface of httpClient.createHttpClient() exactly so
// the two are drop-in substitutable.

const { ROLE_TO_SEGMENT } = require("./httpClient");

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function thirtyDaysFromNow() {
  return new Date(Date.now() + THIRTY_DAYS_MS).toISOString();
}

function mockVerificationId() {
  // Format mirrors Harjoot's HJ-P-<year>-<id>. We add a MOCK marker so logs
  // make clear this is not a real anchored proof.
  const stamp = Date.now().toString(36).toUpperCase();
  return `HJ-P-MOCK-${stamp}`;
}

const DEFAULT_RESPONSES = {
  getPartnerInfo() {
    return {
      partner: { slug: "hackchain", active: true },
      modes: ["hash_only", "anchor"],
      fileOptions: [{ label: "PDF", contentType: "application/pdf" }],
    };
  },

  activateAccess(role) {
    return {
      success: true,
      membership: {
        active: true,
        expires_at: thirtyDaysFromNow(),
        segment: ROLE_TO_SEGMENT[role] || "unknown",
      },
    };
  },

  checkAccess() {
    return {
      active: true,
      expires_at: thirtyDaysFromNow(),
    };
  },

  uploadCertificate(payload) {
    const documentHash =
      (payload && payload.document && payload.document.hash) ||
      (payload && payload.certificate && payload.certificate.certificate_hash) ||
      "0".repeat(64);
    const verificationId = mockVerificationId();
    return {
      success: true,
      certificate: {
        verificationId,
        partnerCertificateId: (payload && payload.certificate && payload.certificate.id) || "MOCK-CERT",
        status: "verified",
        document: { hash: documentHash },
        verification: {
          url: `https://harjoot.mock/verify/${verificationId}`,
          qrCodeUrl: `https://harjoot.mock/verify/${verificationId}/qr`,
        },
        blockchain: { partnerTxHash: null, harjootTxHash: null, explorerUrl: null },
      },
    };
  },

  notifyPayment() {
    // The real endpoint is TBD (DS TODO 6). The mock returns success so the
    // treasury worker can be exercised end-to-end during development.
    return {
      success: true,
      message: "[mock] Payment notification acknowledged",
    };
  },
};

/**
 * Create a mock Harjoot client.
 *
 * @returns {{
 *   getPartnerInfo(): Promise<object>,
 *   activateAccess(role: string, user: object, profile: object): Promise<object>,
 *   checkAccess(walletAddress: string, role: string): Promise<object>,
 *   uploadCertificate(payload: object): Promise<object>,
 *   notifyPayment(verificationIds: string[], usdtTxHash: string): Promise<object>,
 *   __calls: Array<{method: string, args: unknown[]}>,
 *   __setNextResponse(method: string, value: unknown): void,
 *   __setNextError(method: string, error: Error): void,
 *   __reset(): void,
 * }}
 */
function createMockClient() {
  const calls = [];
  const nextResponses = new Map();
  const nextErrors = new Map();

  function invoke(method, args) {
    calls.push({ method, args });

    if (nextErrors.has(method)) {
      const err = nextErrors.get(method);
      nextErrors.delete(method);
      return Promise.reject(err);
    }
    if (nextResponses.has(method)) {
      const value = nextResponses.get(method);
      nextResponses.delete(method);
      return Promise.resolve(value);
    }
    return Promise.resolve(DEFAULT_RESPONSES[method](...args));
  }

  return {
    // ---- Public surface (must mirror httpClient) ----
    getPartnerInfo() {
      return invoke("getPartnerInfo", []);
    },
    activateAccess(role, user, profile) {
      return invoke("activateAccess", [role, user, profile]);
    },
    checkAccess(walletAddress, role) {
      return invoke("checkAccess", [walletAddress, role]);
    },
    uploadCertificate(payload) {
      return invoke("uploadCertificate", [payload]);
    },
    notifyPayment(verificationIds, usdtTxHash) {
      return invoke("notifyPayment", [verificationIds, usdtTxHash]);
    },

    // ---- Test helpers (not for production use) ----
    __calls: calls,
    __setNextResponse(method, value) {
      if (!(method in DEFAULT_RESPONSES)) {
        throw new TypeError(`Unknown mock method: ${method}`);
      }
      nextResponses.set(method, value);
    },
    __setNextError(method, error) {
      if (!(method in DEFAULT_RESPONSES)) {
        throw new TypeError(`Unknown mock method: ${method}`);
      }
      nextErrors.set(method, error);
    },
    __reset() {
      calls.length = 0;
      nextResponses.clear();
      nextErrors.clear();
    },
  };
}

module.exports = { createMockClient };
