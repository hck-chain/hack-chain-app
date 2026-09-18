const crypto = require("crypto");
const { Op } = require("sequelize");

// Links a self-custodied wallet to the authenticated account. The wallet is profile data
// for $HACK — it never grants access, so this endpoint only records it.
// Returns a result object — never throws on business errors.

const NONCE_TTL_SECONDS = 5 * 60;
const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

function parseNonce(message) {
  const match = String(message).match(/Nonce: (\S+)/);
  return match ? match[1] : null;
}

/**
 * @param {object} deps
 * @param {object} deps.models                 { User, sequelize }
 * @param {function} deps.validateSignedMessage (message, signature, wallet) => { ok, error }
 * @param {object} deps.redis                  { getRedis } — optional replay guard
 * @param {string} deps.wallet                 authenticated user's wallet (req.auth.wallet)
 * @param {string} deps.ownWalletAddress
 * @param {string} deps.message
 * @param {string} deps.signature
 */
async function linkOwnWallet({
  models,
  validateSignedMessage,
  redis,
  wallet,
  ownWalletAddress,
  message,
  signature,
}) {
  if (!models || !validateSignedMessage || !wallet) {
    throw new TypeError("linkOwnWallet requires { models, validateSignedMessage, wallet }");
  }

  const { User, sequelize } = models;

  if (!ownWalletAddress || !EVM_ADDRESS.test(ownWalletAddress)) {
    return {
      ok: false,
      code: "INVALID_WALLET_ADDRESS",
      httpStatus: 400,
      message: "A valid own_wallet_address is required",
    };
  }
  if (!message || !signature) {
    return {
      ok: false,
      code: "MISSING_SIGNATURE",
      httpStatus: 400,
      message: "message and signature are required",
    };
  }

  const target = ownWalletAddress.toLowerCase();

  // The signature must come from the wallet being linked, not from the session wallet:
  // that is what proves the user actually controls it.
  const validation = validateSignedMessage(message, signature, target);
  if (!validation.ok) {
    return { ok: false, code: "INVALID_SIGNATURE", httpStatus: 401, message: validation.error };
  }

  const nonce = parseNonce(message);
  if (!nonce) {
    return {
      ok: false,
      code: "MISSING_NONCE",
      httpStatus: 400,
      message: "The signed message must include a Nonce line",
    };
  }

  // One-time use: a signature captured inside its 5-minute window cannot be replayed.
  // Redis is best-effort here, like everywhere else in this codebase — if it is down the
  // timestamp window is still enforced by validateSignedMessage.
  if (redis && typeof redis.getRedis === "function") {
    try {
      const key = `walletlink:${crypto.createHash("sha256").update(`${target}:${nonce}`).digest("hex")}`;
      const stored = await redis.getRedis().set(key, "1", "EX", NONCE_TTL_SECONDS, "NX");
      if (stored === null) {
        return {
          ok: false,
          code: "NONCE_ALREADY_USED",
          httpStatus: 409,
          message: "This signature was already used",
        };
      }
    } catch (_) {
      // Cache unavailable — proceed on the timestamp window alone.
    }
  }

  const sessionWallet = wallet.toLowerCase();
  const me = await User.findOne({ where: { wallet_address: sessionWallet } });
  if (!me) {
    return { ok: false, code: "USER_NOT_FOUND", httpStatus: 404, message: "User not found" };
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
    return {
      ok: false,
      code: "WALLET_ALREADY_LINKED",
      httpStatus: 409,
      message: "This wallet is already linked to another account",
    };
  }

  await sequelize.transaction(async (t) => {
    await me.update({ own_wallet_address: target }, { transaction: t });
  });

  return { ok: true, data: { own_wallet_address: target } };
}

module.exports = { linkOwnWallet };
