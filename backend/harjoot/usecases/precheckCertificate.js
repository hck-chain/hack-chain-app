// backend/harjoot/usecases/precheckCertificate.js
//
// DS Section 4 — precheck before /issue. The frontend calls this BEFORE
// asking the educator to sign the HACK transfer transaction. Three things
// are answered atomically:
//   1) Is the educator allowed to issue right now? (approval status)
//   2) Does the talent wallet already belong to a registered student?
//      If not, the UI should fall back to Section 5 (invite flow).
//   3) What is the exact HACK amount + on-chain addresses the issuer
//      must use for the payment? (paymentService.calculateMintPrice)
//
// Returns a Result-style object; throws ONLY on programmer errors.

const LOG_PREFIX = "[precheckCertificate]";

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * @param {object} params
 * @param {object} params.models          db (db.User).
 * @param {object} params.paymentService  Must expose calculateMintPrice().
 * @param {object} params.educator        The authenticated issuer's User row.
 * @param {string} params.studentWallet   Target talent wallet (any casing).
 * @returns {Promise<{
 *   ok: boolean,
 *   reason?: "EDUCATOR_NOT_APPROVED" | "TALENT_NOT_FOUND",
 *   price?: {
 *     amountHack: bigint,
 *     amountHackString: string,
 *     userPriceUsdCents: number,
 *     treasuryAddress: string,
 *     hackTokenAddress: string,
 *   },
 *   talent?: { id: number, walletAddress: string },
 * }>}
 */
async function precheckCertificate({ models, paymentService, educator, studentWallet }) {
  if (!models || !models.User || !paymentService || typeof paymentService.calculateMintPrice !== "function") {
    throw new TypeError(
      "precheckCertificate requires { models.User, paymentService.calculateMintPrice, educator, studentWallet }",
    );
  }
  if (!educator || typeof educator !== "object") {
    throw new TypeError("precheckCertificate requires an educator User row");
  }
  if (typeof studentWallet !== "string" || !WALLET_REGEX.test(studentWallet)) {
    throw new TypeError("precheckCertificate requires a valid 0x-prefixed wallet address");
  }

  // (1) Educator approval gate. Section 2.5 sets this on register/approve.
  if (educator.educator_approval_status !== "approved") {
    console.warn(
      `${LOG_PREFIX} educator_id=${educator.id} blocked status=${educator.educator_approval_status}`,
    );
    return { ok: false, reason: "EDUCATOR_NOT_APPROVED" };
  }

  const normalizedWallet = studentWallet.toLowerCase();

  // (2) Talent must exist as a registered student. Equality + role check in
  // one query — a recruiter or issuer accidentally given this wallet must
  // NOT pass as a valid talent.
  const talent = await models.User.findOne({
    where: { wallet_address: normalizedWallet, role: "student" },
    attributes: ["id", "wallet_address"],
  });
  if (!talent) {
    return { ok: false, reason: "TALENT_NOT_FOUND" };
  }

  // (3) Pricing. calculateMintPrice() is pure and may throw on a misconfigured
  // env — we let that propagate as a 500 because it's a programmer/config
  // error, not a user-correctable state.
  const price = paymentService.calculateMintPrice();

  return {
    ok: true,
    price: {
      amountHack: price.amountHack,
      // bigint does not survive JSON.stringify. Provide a decimal string so the
      // route handler can serialize it directly into the response body.
      amountHackString: price.amountHack.toString(),
      userPriceUsdCents: price.userPriceUsdCents,
      treasuryAddress: price.treasuryAddress,
      hackTokenAddress: price.hackTokenAddress,
    },
    talent: { id: talent.id, walletAddress: talent.wallet_address },
  };
}

module.exports = { precheckCertificate };
