// Checks link-privy and the unique indexes of users against a real local Postgres. See the backend README.
"use strict";

const crypto = require("crypto");

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const target = {
  host: process.env.VERIFY_DB_HOST || "localhost",
  port: process.env.VERIFY_DB_PORT || "5433",
  user: process.env.VERIFY_DB_USER || "postgres",
  password: process.env.VERIFY_DB_PASSWORD || "postgres",
  database: process.env.VERIFY_DB_NAME || "hackchain",
};
const bootstrap = process.argv.includes("--bootstrap");

function abort(message) {
  console.error(`ABORT: ${message}`);
  process.exit(2);
}

if (!LOCAL_HOSTS.has(target.host)) {
  abort(`VERIFY_DB_HOST=${target.host} is not local. This script only runs against a local database.`);
}

// Blank every DB URL (the models prefer them, and here they are usually production) before ../models loads.
Object.assign(process.env, {
  DATABASE_URL: "",
  DATABASE_URL_UNPOOLED: "",
  DB_DATABASE_URL: "",
  DB_PGHOST: target.host,
  DB_HOST: target.host,
  DB_PORT: target.port,
  DB_PGUSER: target.user,
  DB_USER: target.user,
  DB_PGPASSWORD: target.password,
  DB_PASSWORD: target.password,
  DB_PGDATABASE: target.database,
  DB_NAME: target.database,
});

const db = require("../models");
const { bindPrivyIdentity } = require("../usecases/users/bindPrivyIdentity");

const { User, sequelize } = db;
const EXPECTED_INDEXES = [
  ["users_email_unique", "email"],
  ["users_privy_did_unique", "privy_did"],
  ["users_integrated_wallet_address_unique", "integrated_wallet_address"],
  ["users_own_wallet_address_unique", "own_wallet_address"],
];

const results = [];
const created = [];
const tag = crypto.randomBytes(4).toString("hex");
const newWallet = () => "0x" + crypto.randomBytes(20).toString("hex");
const email = (name) => `privy-verify-${tag}-${name}@hackchain.test`;

function check(name, ok, detail = "") {
  results.push(ok);
  console.log(`${ok ? "OK   " : "FAIL "} ${name}${detail ? `  -> ${detail}` : ""}`);
}

async function mkUser(attrs = {}) {
  const wallet = attrs.wallet_address || newWallet();
  created.push(wallet);
  return User.create({
    role: "student",
    nonce: crypto.randomBytes(16).toString("hex"),
    is_active: true,
    email: null,
    ...attrs,
    wallet_address: wallet,
  });
}

function bind(user, identity, models = { User, sequelize }) {
  return bindPrivyIdentity({
    models,
    privyService: { verifyIdentityToken: async () => identity },
    wallet: user.wallet_address,
    identityToken: "token",
  });
}

async function rejectsWithUniqueViolation(fn) {
  try {
    await fn();
    return false;
  } catch (err) {
    return err.name === "SequelizeUniqueConstraintError";
  }
}

async function ensureSchema() {
  const tables = (await sequelize.getQueryInterface().showAllTables()).map((t) => (typeof t === "string" ? t : t.tableName));

  if (bootstrap) {
    // Mirrors migrate-email-unique.js and migrate-privy-identity.js. It never alters an existing table beyond adding what is missing.
    if (!tables.includes("users")) await User.sync();
    await sequelize.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS privy_did VARCHAR(100),
        ADD COLUMN IF NOT EXISTS integrated_wallet_address VARCHAR(42),
        ADD COLUMN IF NOT EXISTS own_wallet_address VARCHAR(42)`);
    for (const [name, column] of EXPECTED_INDEXES) {
      await sequelize.query(`CREATE UNIQUE INDEX IF NOT EXISTS ${name} ON users (${column}) WHERE ${column} IS NOT NULL`);
    }
  } else if (!tables.includes("users")) {
    abort("there is no users table in this database. Use a local database that already has the schema, or pass --bootstrap.");
  }

  const columns = await sequelize.getQueryInterface().describeTable("users");
  const missingColumns = ["privy_did", "integrated_wallet_address", "own_wallet_address"].filter((c) => !columns[c]);
  const [rows] = await sequelize.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'users'");
  const missingIndexes = EXPECTED_INDEXES.filter(([name]) => {
    const row = rows.find((r) => r.indexname === name);
    return !row || !/UNIQUE/i.test(row.indexdef) || !/WHERE/i.test(row.indexdef);
  }).map(([name]) => name);

  if (missingColumns.length || missingIndexes.length) {
    abort(
      `the schema is incomplete (columns: ${missingColumns.join(", ") || "ok"}; partial unique indexes: ${missingIndexes.join(", ") || "ok"}). ` +
        "Run `npm run migrate:privy-identity` and `node scripts/migrate-email-unique.js` against this database, or pass --bootstrap."
    );
  }
}

async function cleanup() {
  if (created.length) await User.destroy({ where: { wallet_address: created } });
}

async function run() {
  const config = sequelize.config;
  if (!LOCAL_HOSTS.has(config.host) || String(config.port) !== String(target.port) || config.database !== target.database) {
    abort(`the connection points at ${config.host}:${config.port}/${config.database}, not at the local target.`);
  }
  console.log(`target: ${config.host}:${config.port}/${config.database}${bootstrap ? " (bootstrap)" : ""}`);

  await ensureSchema();

  console.log("\nUnique indexes (partial)");
  const nulls = await Promise.all([mkUser(), mkUser(), mkUser()]);
  check("several rows with no email, no Privy identity and no wallet coexist", nulls.length === 3);

  await mkUser({ email: email("dup") });
  check("a duplicate email is rejected", await rejectsWithUniqueViolation(() => mkUser({ email: email("dup") })));
  check(
    "a duplicate privy_did is rejected",
    await (async () => {
      const did = `did:privy:verify-${tag}`;
      await mkUser({ privy_did: did });
      return rejectsWithUniqueViolation(() => mkUser({ privy_did: did }));
    })()
  );
  check(
    "a duplicate integrated_wallet_address is rejected",
    await (async () => {
      const wallet = newWallet();
      await mkUser({ integrated_wallet_address: wallet });
      return rejectsWithUniqueViolation(() => mkUser({ integrated_wallet_address: wallet }));
    })()
  );

  console.log("\nlink-privy: a retry completes what was pending, and a verified email takes priority");
  const sharedEmail = email("shared");
  const legacy = await mkUser({ email: null });
  const legacyWallet = legacy.wallet_address;
  const unverified = await mkUser({
    email: sharedEmail,
    email_verified: false,
    verification_token: "stale",
    verification_token_expires_at: new Date(Date.now() + 60000),
  });
  const did = `did:privy:legacy-${tag}`;
  const embedded = newWallet();

  const first = await bind(legacy, { did, email: sharedEmail, embeddedWallet: null });
  await Promise.all([legacy.reload(), unverified.reload()]);
  check("first call without wallet saves the identity and the email", first.ok && legacy.privy_did === did && legacy.email === sharedEmail && legacy.email_verified === true);
  check("the unverified account lost the email and its verification token", unverified.email === null && unverified.verification_token === null && unverified.verification_token_expires_at === null);
  check("the wallet is still pending, so the account is not migrated", legacy.integrated_wallet_address === null && !(legacy.privy_did && legacy.integrated_wallet_address));

  const retry = await bind(legacy, { did, email: sharedEmail, embeddedWallet: embedded });
  await legacy.reload();
  check("the retry completes the embedded wallet", retry.ok && retry.data.alreadyBound === true && legacy.integrated_wallet_address === embedded);
  check("wallet_address was never moved", legacy.wallet_address === legacyWallet);

  const again = await bind(legacy, { did, email: sharedEmail, embeddedWallet: embedded });
  check("a further retry with nothing pending is harmless", again.ok && again.data.integrated_wallet_address === embedded);

  console.log("\nlink-privy: what must not be taken");
  const kept = await mkUser({ email: email("own-profile-email") });
  const keptResult = await bind(kept, { did: `did:privy:kept-${tag}`, email: email("other"), embeddedWallet: newWallet() });
  await kept.reload();
  check("an email the profile already has is kept", keptResult.ok && kept.email === email("own-profile-email"));

  const verifiedHolder = await mkUser({ email: email("verified"), email_verified: true });
  const caller1 = await mkUser();
  const r1 = await bind(caller1, { did: `did:privy:c1-${tag}`, email: email("verified"), embeddedWallet: newWallet() });
  await Promise.all([verifiedHolder.reload(), caller1.reload()]);
  check("a verified account keeps its email (409)", !r1.ok && r1.code === "EMAIL_ALREADY_IN_USE" && verifiedHolder.email === email("verified") && caller1.privy_did === null);

  const privyHolder = await mkUser({ email: email("has-did"), email_verified: false, privy_did: `did:privy:holder-${tag}` });
  const caller2 = await mkUser();
  const r2 = await bind(caller2, { did: `did:privy:c2-${tag}`, email: email("has-did"), embeddedWallet: newWallet() });
  await privyHolder.reload();
  check("an account with its own Privy identity keeps its email (409)", !r2.ok && r2.code === "EMAIL_ALREADY_IN_USE" && privyHolder.email === email("has-did"));

  const spaced = await mkUser();
  const spacedHolder = await mkUser({ email: email("case"), email_verified: false });
  const r3 = await bind(spaced, { did: `did:privy:c3-${tag}`, email: `  ${email("case").toUpperCase()}  `, embeddedWallet: newWallet() });
  await spacedHolder.reload();
  check("the email match ignores case and spaces", r3.ok && spacedHolder.email === null);

  console.log("\nlink-privy: concurrency and atomicity (what only a real database can show)");
  const raceHolder = await mkUser({ email: email("race"), email_verified: true });
  const raceCaller = await mkUser();
  const originalFindOne = User.findOne;
  User.findOne = async function (options) {
    // Show the use case a stale view in which the holder is still unverified, as if it got verified a moment ago.
    if (options && options.where && options.where.email === email("race")) {
      return { id: raceHolder.id, email: raceHolder.email, email_verified: false, privy_did: null, wallet_address: raceHolder.wallet_address };
    }
    return originalFindOne.apply(this, arguments);
  };
  let race;
  try {
    race = await bind(raceCaller, { did: `did:privy:race-${tag}`, email: email("race"), embeddedWallet: newWallet() });
  } finally {
    User.findOne = originalFindOne;
  }
  await Promise.all([raceHolder.reload(), raceCaller.reload()]);
  check("an account verified between the check and the write keeps its email", !race.ok && race.code === "EMAIL_ALREADY_IN_USE" && raceHolder.email === email("race") && raceCaller.email === null);

  const txHolder = await mkUser({ email: email("tx"), email_verified: false });
  const txCaller = await mkUser();
  const hadOwnUpdate = Object.prototype.hasOwnProperty.call(User.prototype, "update");
  const originalUpdate = User.prototype.update;
  User.prototype.update = async function () {
    throw new Error("forced failure after the email was released");
  };
  let threw = false;
  try {
    await bind(txCaller, { did: `did:privy:tx-${tag}`, email: email("tx"), embeddedWallet: newWallet() });
  } catch (_) {
    threw = true;
  } finally {
    if (hadOwnUpdate) User.prototype.update = originalUpdate;
    else delete User.prototype.update;
  }
  await Promise.all([txHolder.reload(), txCaller.reload()]);
  check("if the write fails halfway the other account keeps its email (rollback)", threw && txHolder.email === email("tx") && txCaller.privy_did === null && txCaller.email === null);
}

(async () => {
  let failed = false;
  try {
    await run();
  } catch (err) {
    failed = true;
    console.error(`UNEXPECTED ERROR: ${err.message}`);
  } finally {
    try {
      await cleanup();
      const left = created.length ? await User.count({ where: { wallet_address: created } }) : 0;
      console.log(`\ncleanup: test rows left = ${left}`);
      if (left !== 0) failed = true;
    } catch (err) {
      failed = true;
      console.error(`CLEANUP FAILED: ${err.message}`);
    }
    await sequelize.close();
    const bad = results.filter((r) => !r).length;
    console.log(bad === 0 && !failed ? `ALL OK (${results.length} checks)` : `${bad} CHECKS FAILED${failed ? " (and an error occurred)" : ""}`);
    process.exit(bad === 0 && !failed ? 0 : 1);
  }
})();
