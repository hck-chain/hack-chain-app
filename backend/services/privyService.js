// Privy identity adapter.
//
// Both tokens are verified offline against the app's ES256 verification key, so no call
// reaches Privy on the login path and the app secret is never needed here:
//   - access token   -> proves the caller controls a Privy account, yields its DID
//   - identity token -> carries the signed user object, yields the embedded wallet
//
// Config/mock structure mirrors harjoot/config.js: fail fast with an actionable message,
// lazy singleton, and a mock flag so tests and local boot work without credentials.
require("dotenv").config();

const LOG_PREFIX = "[privy]";

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

const USE_MOCK = parseBool(process.env.PRIVY_USE_MOCK, false);

let cached = null;

function loadConfig() {
  const appId = process.env.PRIVY_APP_ID;
  const verificationKey = process.env.PRIVY_VERIFICATION_KEY;

  if (!appId) {
    throw new Error(
      "PRIVY_APP_ID is required. Copy it from the Privy dashboard (Configuration > Basics), " +
        "or set PRIVY_USE_MOCK=true to run without credentials."
    );
  }
  if (!verificationKey) {
    throw new Error(
      "PRIVY_VERIFICATION_KEY is required. Copy the JWT verification key from the Privy " +
        "dashboard (Configuration > App settings), or set PRIVY_USE_MOCK=true."
    );
  }

  // .env cannot hold real newlines, so the PEM is stored with escaped ones.
  return { appId, verificationKey: verificationKey.replace(/\\n/g, "\n") };
}

function getConfig() {
  if (!cached) cached = loadConfig();
  return cached;
}

function mockDidFromToken(token) {
  return `did:privy:mock-${String(token).slice(0, 24)}`;
}

/**
 * Verifies a Privy access token and returns the caller's DID.
 * Returns null when the token is missing, expired or not signed by this app.
 */
async function verifyAccessToken(accessToken) {
  if (!accessToken || typeof accessToken !== "string") return null;

  if (USE_MOCK) {
    return accessToken.startsWith("invalid") ? null : { did: mockDidFromToken(accessToken) };
  }

  const { appId, verificationKey } = getConfig();
  const privy = require("@privy-io/node");

  try {
    const claims = await privy.verifyAccessToken({
      access_token: accessToken,
      app_id: appId,
      verification_key: verificationKey,
    });
    return { did: claims.user_id };
  } catch (err) {
    console.warn(`${LOG_PREFIX} access token rejected: ${err.message}`);
    return null;
  }
}

/**
 * Verifies a Privy identity token and returns { did, email, embeddedWallet }.
 * embeddedWallet is null when Privy has not provisioned it yet, which the caller
 * must treat as "retry later" rather than as a permanent failure.
 * Returns null when the token itself is invalid.
 */
async function verifyIdentityToken(identityToken) {
  if (!identityToken || typeof identityToken !== "string") return null;

  if (USE_MOCK) {
    if (identityToken.startsWith("invalid")) return null;
    return {
      did: mockDidFromToken(identityToken),
      email: identityToken.includes("noemail") ? null : "mock@hackchain.test",
      // "nowallet" exercises the not-provisioned-yet branch without real credentials.
      embeddedWallet: identityToken.includes("nowallet")
        ? null
        : `0x${"ab".repeat(20)}`,
    };
  }

  const { appId, verificationKey } = getConfig();
  const privy = require("@privy-io/node");

  let user;
  try {
    user = await privy.verifyIdentityToken({
      identity_token: identityToken,
      app_id: appId,
      verification_key: verificationKey,
    });
  } catch (err) {
    console.warn(`${LOG_PREFIX} identity token rejected: ${err.message}`);
    return null;
  }

  const accounts = Array.isArray(user.linked_accounts) ? user.linked_accounts : [];

  // user.wallet is the most recently connected wallet, which may be an external one,
  // so the embedded wallet has to be picked out explicitly.
  const embedded = accounts.find(
    (account) => privy.isEmbeddedWalletLinkedAccount(account) && account.chain_type === "ethereum"
  );
  const emailAccount = accounts.find((account) => account.type === "email");
  const googleAccount = accounts.find((account) => account.type === "google_oauth");

  return {
    did: user.id,
    email: emailAccount?.address || googleAccount?.email || null,
    embeddedWallet: embedded?.address ? embedded.address.toLowerCase() : null,
  };
}

function isMockEnabled() {
  return USE_MOCK;
}

// Tests mutate env between cases; this drops the memoised config.
function __resetForTests() {
  cached = null;
}

module.exports = {
  verifyAccessToken,
  verifyIdentityToken,
  isMockEnabled,
  __resetForTests,
};
