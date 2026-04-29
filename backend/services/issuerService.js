const { ethers } = require("ethers");
const { User, UserSession, sequelize } = require("../models");
const { revokeIssuer } = require("./authorizeIssuer");
const { deleteSession } = require("./redis");

const MAX_SIGNATURE_AGE_MS = 5 * 60 * 1000; // 5 minutes

function verifyDeletionSignature(message, signature, expectedWallet) {
  try {
    const signer = ethers.verifyMessage(message, signature);
    return signer.toLowerCase() === expectedWallet.toLowerCase();
  } catch {
    return false;
  }
}

function parseMessageTimestamp(message) {
  const match = message.match(/Timestamp: (.+)/);
  if (!match) return null;
  const ts = new Date(match[1]);
  return isNaN(ts.getTime()) ? null : ts;
}

function validateDeletionMessage(message, signature, wallet) {
  const ts = parseMessageTimestamp(message);
  if (!ts) return { ok: false, error: "Invalid message format" };

  const age = Date.now() - ts.getTime();
  if (age > MAX_SIGNATURE_AGE_MS || age < 0) {
    return { ok: false, error: "Signature expired or invalid timestamp" };
  }

  if (!verifyDeletionSignature(message, signature, wallet)) {
    return { ok: false, error: "Signature does not match wallet" };
  }

  return { ok: true };
}

async function deleteIssuerAccount(wallet) {
  // Revoke on-chain first — if this fails, DB stays untouched
  await revokeIssuer(wallet);

  await sequelize.transaction(async (t) => {
    await UserSession.destroy({ where: { wallet_address: wallet }, transaction: t });
    // CASCADE: User → Issuer → Certificate (DB records only, NFTs are on-chain and immutable)
    await User.destroy({ where: { wallet_address: wallet }, transaction: t });
  });

  // Best-effort Redis cleanup — don't fail the request if Redis is down
  try {
    await deleteSession(wallet);
  } catch (_) {}
}

module.exports = {
  validateDeletionMessage,
  deleteIssuerAccount,
};
