// backend/services/harjootService.js
//
// SKELETON — Harjoot partner API integration.
// Implementation pending: the Harjoot partner API key and live host are not
// available yet. Every function below documents its request/response contract
// and throws until implemented.
//
// Reference documents (documents/):
//   - client-integration-guide.pdf
//   - hackchain-harjoot-integration-gaps.pdf
//   - hackchain-harjoot-sequence.txt
//   - harjoot-integration-handoff.md   (file map + open decisions)
//
// SECURITY RULE (gaps PDF, "Core Rule"):
//   The partner API key is server-side ONLY. Never expose it to the browser.
//   The HackChain backend is the only caller of Harjoot.

// ---------------------------------------------------------------------------
// Configuration — to be wired during implementation.
//   HARJOOT_API_BASE_URL     e.g. https://<harjoot-host>/api/partner/hackchain/v1
//   HARJOOT_PARTNER_API_KEY  partner key, sent as the `x-api-key` header.
// TODO(impl): build a shared axios client with the base URL and the
// `x-api-key` header pre-set. Reference: client-integration-guide.pdf section 1.
// ---------------------------------------------------------------------------

const NOT_IMPLEMENTED =
  "Harjoot integration not implemented yet — see documents/harjoot-integration-handoff.md";

// Maps a HackChain internal role to the Harjoot API `segment` value.
// HackChain stores roles as student/issuer/recruiter; Harjoot expects the
// user-facing segment talent/educator/recruiter.
// Reference: hackchain-harjoot-integration-gaps.pdf, "Supported segments".
const ROLE_TO_SEGMENT = Object.freeze({
  student: "talent",
  issuer: "educator",
  recruiter: "recruiter",
});

/**
 * DS Section 0 — Partner health check.
 * Calls GET /partners/me to confirm the API key works, the partner account is
 * active, and which processing modes / file options are enabled. Intended to
 * run once on backend startup; cache the result in memory.
 *
 * @returns {Promise<{partner: {slug: string, active: boolean}, modes: string[], fileOptions: object[]}>}
 * @throws {Error} not implemented
 */
async function getPartnerInfo() {
  // TODO(impl): GET {HARJOOT_API_BASE_URL}/partners/me with the x-api-key header.
  // Reference: client-integration-guide.pdf section 2; DS Section 0.
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * DS Section 2 — Role activation / Harjoot membership.
 * Calls POST /access/activate to register the HackChain user inside Harjoot
 * partner records and create a 30-day membership for the mapped segment.
 * Called right after a user registers with a role (see routes/users.js).
 *
 * @param {string} role     HackChain role: student | issuer | recruiter.
 * @param {object} user     { id, wallet_address, role, name, lastname, email }.
 * @param {object} profile  Role profile: { field_of_study } | { organization_name } | { company_name }.
 * @returns {Promise<{success: boolean, membership: {active: boolean, expires_at: string, segment: string}}>}
 * @throws {Error} not implemented
 */
async function activateAccess(role, user, profile) {
  // const segment = ROLE_TO_SEGMENT[role];
  // TODO(impl): POST {HARJOOT_API_BASE_URL}/access/activate with the x-api-key header.
  // Body: { segment, external_user_id, user: {...}, student|issuer|recruiter: {...} }.
  // Reference: gaps PDF "1. Hackchain User Chooses A Role"; DS Section 2.
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * DS Section 3 — Access status check.
 * Calls GET /access/status to confirm a user still has an active membership.
 * Used by middleware/harjootAccess.js. In the free-test phase an expired
 * membership is simply re-activated (free) via activateAccess.
 *
 * @param {string} walletAddress  Lowercased wallet address.
 * @param {string} role           HackChain role, mapped to a Harjoot segment.
 * @returns {Promise<{active: boolean, expires_at: string|null}>}
 * @throws {Error} not implemented
 */
async function checkAccess(walletAddress, role) {
  // TODO(impl): GET {HARJOOT_API_BASE_URL}/access/status?wallet_address=...&segment=...
  // Reference: gaps PDF "2. Hackchain Checks Access"; DS Section 3.
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * DS Section 4 — Certificate proof upload.
 * Calls POST /certificates/upload to store the certificate hash in Harjoot and
 * obtain a verification ID, a public verification URL and a QR code URL.
 *
 * Required by Harjoot (client-integration-guide.pdf sections 4-5):
 *   - idempotency_key   unique per certificate (replay protection)
 *   - processing.mode   "hash_only" (no Harjoot anchor) — see DS decision 1
 *   - issuer            { wallet_address, name, email }
 *   - student           { wallet_address, name, email }
 *   - certificate       { id, title, description, certificate_hash, issue_date }
 *   - document          { filename, content_type, hash }
 * The certificate_hash MUST be a 64-character SHA-256 hex string.
 *
 * @param {object} payload  Upload payload as described above.
 * @returns {Promise<{verificationId: string, verificationUrl: string, qrCodeUrl: string, status: string}>}
 * @throws {Error} not implemented
 */
async function uploadCertificate(payload) {
  // TODO(impl): POST {HARJOOT_API_BASE_URL}/certificates/upload with the x-api-key header.
  // Reference: client-integration-guide.pdf sections 4-5; DS Section 4.
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * DS Section 13 — Treasury payment notification (OPEN: endpoint not finalized).
 * After the async worker forwards USDT to Harjoot, it notifies Harjoot of the
 * payment. The exact endpoint and payload are still TBD with the Harjoot team
 * (DS TODO 6).
 *
 * @param {string[]} verificationIds  Certificates covered by this payment.
 * @param {string}   usdtTxHash       On-chain USDT transfer hash.
 * @returns {Promise<{success: boolean}>}
 * @throws {Error} not implemented
 */
async function notifyPayment(verificationIds, usdtTxHash) {
  // TODO(impl): endpoint + payload pending agreement with Harjoot (DS TODO 6).
  throw new Error(NOT_IMPLEMENTED);
}

module.exports = {
  ROLE_TO_SEGMENT,
  getPartnerInfo,
  activateAccess,
  checkAccess,
  uploadCertificate,
  notifyPayment,
};
