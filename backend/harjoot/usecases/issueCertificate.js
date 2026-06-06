// backend/harjoot/usecases/issueCertificate.js
//
// DS Section 4 orchestrator — turns a verified $HACK payment into a
// fully-issued certificate. Wires together every Phase 7 building block:
//
//   1. defense-in-depth: re-validate educator approval + talent existence
//      (the route's precheck is advisory only; we never trust the client).
//   2. SHA-256 the PDF -> certificate_hash (UNIQUE in DB).
//   3. paymentService.verifyHackPayment — Result-style. This is the
//      operation that creates the `payments` row + enforces replay
//      protection (its own tx_hash UNIQUE constraint).
//   4. IPFS pin via injected ipfsUpload() -> tokenUri.
//   5. harjootClient.uploadCertificate({ ..., processing.mode: 'hash_only' }).
//   6. on-chain mint via mintAdapter -> { tokenId, txHash }.
//   7. atomic INSERT of certificates + treasury_transfers_queue inside a
//      Sequelize transaction.
//
// Failure boundary semantics:
//   - Steps before the mint either return a clean Result (no chain mutation)
//     or have already persisted the payment row, in which case we bubble up
//     the failure with paymentId attached so ops can reconcile.
//   - A failure AFTER mint (only the final persist) leaves the NFT on-chain
//     with no DB row. We surface PERSIST_FAILED with tokenId + txHash so a
//     reconciliation job can later create the missing rows; we do NOT try to
//     burn the token (the contract is the source of truth — DB catches up).
//
// Idempotency: each call generates a fresh idempotency_key for Harjoot.
// At our DB level, the payment_tx_hash UNIQUE constraint prevents two
// concurrent /issue calls for the same payment from both minting.

const crypto = require("crypto");

const LOG_PREFIX = "[issueCertificate]";
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;
const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function assertDeps({
  models, paymentService, harjootClient, mintAdapter, ipfsUpload, provider,
}) {
  if (!models || !models.Certificate || !models.Payment || !models.TreasuryTransfer
      || !models.User || !models.Issuer || !models.sequelize) {
    throw new TypeError(
      "issueCertificate requires { models.{Certificate, Payment, TreasuryTransfer, User, Issuer, sequelize} }",
    );
  }
  if (!paymentService || typeof paymentService.verifyHackPayment !== "function"
      || typeof paymentService.calculateMintPrice !== "function") {
    throw new TypeError("issueCertificate requires paymentService { verifyHackPayment, calculateMintPrice }");
  }
  if (!harjootClient || typeof harjootClient.uploadCertificate !== "function") {
    throw new TypeError("issueCertificate requires harjootClient.uploadCertificate");
  }
  if (!mintAdapter || typeof mintAdapter.mintCertificate !== "function") {
    throw new TypeError("issueCertificate requires mintAdapter.mintCertificate");
  }
  if (typeof ipfsUpload !== "function") {
    throw new TypeError("issueCertificate requires ipfsUpload(...) async function");
  }
  if (!provider || typeof provider.getTransactionReceipt !== "function") {
    throw new TypeError("issueCertificate requires provider.getTransactionReceipt");
  }
}

function assertInputs({
  educator, studentWallet, title, issueDate, paymentTxHash, pdfBuffer,
}) {
  if (!educator || typeof educator !== "object" || !educator.wallet_address) {
    throw new TypeError("issueCertificate requires an educator User row with wallet_address");
  }
  if (typeof studentWallet !== "string" || !WALLET_REGEX.test(studentWallet)) {
    throw new TypeError("issueCertificate requires a valid studentWallet");
  }
  if (!title || typeof title !== "string" || !title.trim()) {
    throw new TypeError("issueCertificate requires a non-empty title");
  }
  if (typeof issueDate !== "string" || !ISO_DATE_REGEX.test(issueDate)) {
    throw new TypeError("issueCertificate requires issueDate as YYYY-MM-DD");
  }
  if (typeof paymentTxHash !== "string" || !TX_HASH_REGEX.test(paymentTxHash)) {
    throw new TypeError("issueCertificate requires a 32-byte paymentTxHash");
  }
  if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
    throw new TypeError("issueCertificate requires a non-empty pdfBuffer");
  }
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * @returns {Promise<
 *   | { ok: true, certificate: { id, tokenId, txHash, certificateHash, tokenUri,
 *                                verificationId, verificationUrl, qrUrl,
 *                                paymentId, treasuryTransferId } }
 *   | { ok: false, reason: string, ... }
 * >}
 */
async function issueCertificate(params) {
  const {
    models, paymentService, harjootClient, mintAdapter, ipfsUpload, provider,
    educator, studentWallet, title, description = null, issueDate,
    paymentTxHash, pdfBuffer, pdfFileName = "certificate.pdf",
  } = params;

  assertDeps(params);
  assertInputs(params);

  // ---- 1. Defense-in-depth: educator approval + talent existence ------------
  if (educator.educator_approval_status !== "approved") {
    return { ok: false, reason: "EDUCATOR_NOT_APPROVED" };
  }

  const normalizedStudent = studentWallet.toLowerCase();
  const talent = await models.User.findOne({
    where: { wallet_address: normalizedStudent, role: "student" },
    attributes: ["id", "wallet_address", "name", "email"],
  });
  if (!talent) {
    return { ok: false, reason: "TALENT_NOT_FOUND" };
  }

  // Fetch issuer row for org name (passed to Harjoot for richer metadata).
  const issuer = await models.Issuer.findOne({
    where: { wallet_address: educator.wallet_address.toLowerCase() },
    attributes: ["wallet_address", "organization_name"],
  });
  const organizationName = issuer ? issuer.organization_name : null;

  // ---- 2. SHA-256 of the PDF ------------------------------------------------
  const certificateHash = sha256(pdfBuffer);

  // ---- 3. Verify HACK payment ----------------------------------------------
  const pricing = paymentService.calculateMintPrice();
  const paymentResult = await paymentService.verifyHackPayment({
    models,
    provider,
    txHash: paymentTxHash,
    expectedFrom: educator.wallet_address,
    expectedAmountHack: pricing.amountHack,
    purpose: "certificate_issuance",
    pricing: {
      harjootCostUsdCents: pricing.harjootCostUsdCents,
      userPriceUsdCents: pricing.userPriceUsdCents,
    },
  });
  if (!paymentResult.ok) {
    // Bubble up the payment reason intact. The route turns it into HTTP.
    return paymentResult;
  }
  const paymentId = paymentResult.payment.id;

  // ---- 4. IPFS upload -------------------------------------------------------
  let ipfsResult;
  try {
    ipfsResult = await ipfsUpload({
      pdfBuffer,
      pdfFileName,
      title,
      description,
      studentWallet: talent.wallet_address,
      certificateHash,
      issueDate,
    });
  } catch (err) {
    console.error(`${LOG_PREFIX} IPFS upload failed: ${err.message || err}`);
    return {
      ok: false,
      reason: "IPFS_FAILED",
      paymentId,
      error: err.message || String(err),
    };
  }
  const tokenUri = ipfsResult && ipfsResult.tokenUri;
  if (!tokenUri || typeof tokenUri !== "string") {
    return {
      ok: false,
      reason: "IPFS_FAILED",
      paymentId,
      error: "ipfsUpload did not return a tokenUri string",
    };
  }

  // ---- 5. Harjoot uploadCertificate ----------------------------------------
  const idempotencyKey = `cert-${crypto.randomUUID()}-v1`;
  let harjootResp;
  try {
    harjootResp = await harjootClient.uploadCertificate({
      idempotency_key: idempotencyKey,
      processing: { mode: "hash_only" },
      issuer: {
        wallet_address: educator.wallet_address,
        organization_name: organizationName,
        email: educator.email || null,
      },
      student: {
        wallet_address: talent.wallet_address,
        name: talent.name || null,
      },
      certificate: {
        title,
        description,
        issue_date: issueDate,
        token_uri: tokenUri,
        certificate_hash: certificateHash,
      },
      document: { hash: certificateHash },
    });
  } catch (err) {
    console.error(`${LOG_PREFIX} Harjoot uploadCertificate failed: ${err.message || err}`);
    return {
      ok: false,
      reason: "HARJOOT_UPLOAD_FAILED",
      paymentId,
      error: err.message || String(err),
    };
  }

  // Optional fields — Harjoot's contract isn't 100% locked. Tolerate absence.
  const certEnvelope = (harjootResp && harjootResp.certificate) || {};
  const verificationId  = certEnvelope.verificationId || null;
  const verificationUrl = certEnvelope.verification && certEnvelope.verification.url ? certEnvelope.verification.url : null;
  const qrUrl           = certEnvelope.verification && certEnvelope.verification.qrCodeUrl ? certEnvelope.verification.qrCodeUrl : null;

  // ---- 6. On-chain mint ----------------------------------------------------
  let mintResult;
  try {
    mintResult = await mintAdapter.mintCertificate({
      studentWallet: talent.wallet_address,
      studentName: talent.name || "HackChain Talent",
      courseName: title,
      tokenUri,
    });
  } catch (err) {
    console.error(`${LOG_PREFIX} mint failed: ${err.message || err}`);
    return {
      ok: false,
      reason: "MINT_FAILED",
      paymentId,
      verificationId,
      error: err.message || String(err),
    };
  }

  // ---- 7. Atomic persistence (Certificate + TreasuryTransfer) --------------
  let certificate;
  let treasuryTransfer;
  try {
    await models.sequelize.transaction(async (t) => {
      certificate = await models.Certificate.create({
        issuer_wallet_address: educator.wallet_address.toLowerCase(),
        student_wallet_address: talent.wallet_address,
        title,
        description,
        certificate_hash: certificateHash,
        blockchain_tx_hash: mintResult.txHash,
        token_id: mintResult.tokenId.toString(),
        issue_date: issueDate,
        harjoot_verification_id: verificationId,
        harjoot_verification_url: verificationUrl,
        harjoot_qr_url: qrUrl,
        payment_id: paymentId,
        status: "issued",
      }, { transaction: t });

      treasuryTransfer = await models.TreasuryTransfer.create({
        payment_id: paymentId,
        amount_usdt_owed: (pricing.harjootCostUsdCents / 100).toFixed(4),
        destination: "harjoot",
        status: "pending",
      }, { transaction: t });
    });
  } catch (err) {
    // The NFT exists on-chain but the row didn't make it. Surface enough
    // information for an ops reconciliation script to pick it up.
    console.error(`${LOG_PREFIX} persist failed AFTER mint: ${err.message || err}`);
    return {
      ok: false,
      reason: "PERSIST_FAILED",
      paymentId,
      verificationId,
      tokenId: mintResult.tokenId.toString(),
      txHash: mintResult.txHash,
      certificateHash,
      tokenUri,
      error: err.message || String(err),
    };
  }

  console.log(
    `${LOG_PREFIX} issued cert_id=${certificate.id} token_id=${mintResult.tokenId} ` +
      `student=${talent.wallet_address} verification_id=${verificationId}`,
  );

  return {
    ok: true,
    certificate: {
      id: certificate.id,
      tokenId: mintResult.tokenId.toString(),
      txHash: mintResult.txHash,
      certificateHash,
      tokenUri,
      verificationId,
      verificationUrl,
      qrUrl,
      paymentId,
      treasuryTransferId: treasuryTransfer.id,
    },
  };
}

module.exports = { issueCertificate };
