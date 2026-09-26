const crypto = require("crypto");
const { Op } = require("sequelize");

// Links a self-custodied wallet to the authenticated account. The wallet is profile data
// for $HACK — it never grants access, so this endpoint only records it.
// Returns a result object — never throws on business errors.

const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;
// Tolerates a client clock slightly ahead of the server without accepting post-dated messages.
const SIGNATURE_MAX_SKEW_MS = 60 * 1000;
const NONCE_TTL_SECONDS = 5 * 60;
const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

// The signed message must match this template exactly. The fixed action text and the
// account that requests the link are what bind a signature to this operation for this
// account: without them, a signature phished on any other site — or produced by another
// HackChain flow that also uses a Timestamp line, like account deletion — could be
// replayed here to attach the victim's wallet to the attacker's account.
const LINK_MESSAGE_TEMPLATE =
  /^Link wallet (0x[a-fA-F0-9]{40}) to HackChain account (0x[a-fA-F0-9]{40})\nTimestamp: (\S+)\nNonce: ([A-Za-z0-9_-]{8,64})$/;

function buildLinkWalletMessage({ ownWallet, account, timestamp, nonce }) {
  return (
    `Link wallet ${ownWallet} to HackChain account ${account}\n` +
    `Timestamp: ${timestamp}\n` +
    `Nonce: ${nonce}`
  );
}

function reject(code, message, httpStatus = 401) {
  return { ok: false, code, httpStatus, message };
}

/**
 * Checks the message against the exact template and returns the parsed parts, or a
 * rejection. Does not check the signature itself.
 */
function parseLinkMessage(message, { ownWallet, account, now }) {
  const match = LINK_MESSAGE_TEMPLATE.exec(String(message));
  if (!match) {
    return { error: reject("INVALID_MESSAGE_FORMAT", "Signed message does not match the expected format", 400) };
  }

  const [, signedOwnWallet, signedAccount, timestamp, nonce] = match;

  if (signedOwnWallet.toLowerCase() !== ownWallet) {
    return { error: reject("MESSAGE_WALLET_MISMATCH", "Signed message is for a different wallet") };
  }
  if (signedAccount.toLowerCase() !== account) {
    return { error: reject("MESSAGE_ACCOUNT_MISMATCH", "Signed message is for a different account") };
  }

  const signedAt = new Date(timestamp).getTime();
  if (Number.isNaN(signedAt)) {
    return { error: reject("INVALID_MESSAGE_FORMAT", "Signed message has an invalid timestamp", 400) };
  }
  const age = now - signedAt;
  if (age > SIGNATURE_MAX_AGE_MS || age < -SIGNATURE_MAX_SKEW_MS) {
    return { error: reject("SIGNATURE_EXPIRED", "Signature expired or has an invalid timestamp") };
  }

  return { nonce };
}

/**
 * @param {object} deps
 * @param {object} deps.models          { User, sequelize }
 * @param {function} deps.recoverSigner (message, signature) => address — ethers.verifyMessage
 * @param {object} deps.redis           { getRedis } — replay guard, best-effort
 * @param {string} deps.wallet          authenticated user's wallet (req.auth.wallet)
 * @param {string} deps.ownWalletAddress
 * @param {string} deps.message
 * @param {string} deps.signature
 * @param {Date}   [deps.now]           injectable clock for tests
 */
async function linkOwnWallet({
  models,
  recoverSigner,
  redis,
  wallet,
  ownWalletAddress,
  message,
  signature,
  now = new Date(),
}) {
  if (!models || !recoverSigner || !wallet) {
    throw new TypeError("linkOwnWallet requires { models, recoverSigner, wallet }");
  }

  const { User, sequelize } = models;

  if (!ownWalletAddress || !EVM_ADDRESS.test(ownWalletAddress)) {
    return reject("INVALID_WALLET_ADDRESS", "A valid own_wallet_address is required", 400);
  }
  if (!message || !signature) {
    return reject("MISSING_SIGNATURE", "message and signature are required", 400);
  }

  const target = ownWalletAddress.toLowerCase();
  const sessionWallet = wallet.toLowerCase();

  const parsed = parseLinkMessage(message, {
    ownWallet: target,
    account: sessionWallet,
    now: now.getTime(),
  });
  if (parsed.error) return parsed.error;

  // The signature must come from the wallet being linked, not from the session wallet:
  // that is what proves the user actually controls it.
  let signer;
  try {
    signer = recoverSigner(message, signature);
  } catch (_) {
    return reject("INVALID_SIGNATURE", "Invalid signature");
  }
  if (!signer || signer.toLowerCase() !== target) {
    return reject("INVALID_SIGNATURE", "Signature does not match the wallet being linked");
  }

  // One-time use: a signature captured inside its 5-minute window cannot be replayed.
  // Redis is best-effort here, like everywhere else in this codebase — if it is down the
  // timestamp window and the account binding above still hold.
  if (redis && typeof redis.getRedis === "function") {
    try {
      const key = `walletlink:${crypto
        .createHash("sha256")
        .update(`${target}:${parsed.nonce}`)
        .digest("hex")}`;
      const stored = await redis.getRedis().set(key, "1", "EX", NONCE_TTL_SECONDS, "NX");
      if (stored === null) {
        return reject("NONCE_ALREADY_USED", "This signature was already used", 409);
      }
    } catch (_) {
      // Cache unavailable — proceed.
    }
  }

  const me = await User.findOne({ where: { wallet_address: sessionWallet } });
  if (!me) {
    return reject("USER_NOT_FOUND", "User not found", 404);
  }

  // A wallet may only back one profile. Postgres cannot express uniqueness across two
  // columns with an index, so both are checked here: own_wallet_address stops a second
  // user claiming the same payout wallet, and wallet_address stops someone claiming a
  // wallet that already identifies another account. Our own row is excluded because a
  // pre-Privy user's identity wallet legitimately is their own wallet.
  const conflict = await User.findOne({
    where: {
      id: { [Op.ne]: me.id },
      [Op.or]: [{ own_wallet_address: target }, { wallet_address: target }],
    },
  });
  if (conflict) {
    return reject("WALLET_ALREADY_LINKED", "This wallet is already linked to another account", 409);
  }

  await sequelize.transaction(async (t) => {
    await me.update({ own_wallet_address: target }, { transaction: t });
  });

  return { ok: true, data: { own_wallet_address: target } };
}

module.exports = { linkOwnWallet, buildLinkWalletMessage };
