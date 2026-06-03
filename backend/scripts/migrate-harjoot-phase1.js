// backend/scripts/migrate-harjoot-phase1.js
//
// Phase 1 schema migration for the Harjoot integration.
//
// Idempotent — safe to run multiple times. Uses IF NOT EXISTS guards on every
// CREATE/ALTER so re-runs are no-ops.
//
// Run with:
//   npm run migrate:harjoot-phase1
//
// What this creates / alters:
//
//   ALTER TABLE users
//     ADD COLUMN harjoot_membership_expires_at TIMESTAMPTZ
//     ADD COLUMN educator_approval_status      TEXT     -- pending_approval | approved | rejected
//     ADD COLUMN approved_at                   TIMESTAMPTZ
//     ADD COLUMN approved_by                   INTEGER  REFERENCES users(id)
//     ADD COLUMN rejection_reason              TEXT
//
//   ALTER TABLE certificates
//     ADD COLUMN harjoot_verification_id  TEXT
//     ADD COLUMN harjoot_verification_url TEXT
//     ADD COLUMN harjoot_qr_url           TEXT
//     ADD COLUMN payment_id               INTEGER  REFERENCES payments(id)
//     ADD COLUMN status                   TEXT  DEFAULT 'issued'
//
//   CREATE TABLE payments (
//     id                SERIAL PRIMARY KEY,
//     tx_hash           TEXT UNIQUE NOT NULL,
//     from_wallet       VARCHAR(42) NOT NULL,
//     amount_hack       BIGINT NOT NULL,        -- bigint values fit in HACK supply
//     harjoot_price_usd NUMERIC(10,4) NOT NULL,        -- 4 decimals = sub-cent precision
//     user_price_usd    NUMERIC(10,4) NOT NULL,
//     status            TEXT NOT NULL DEFAULT 'confirmed',
//     purpose           TEXT NOT NULL,
//     created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//     updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
//   );
//
//   CREATE TABLE talent_invitations (
//     id                     SERIAL PRIMARY KEY,
//     educator_user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//     student_wallet_address VARCHAR(42) NOT NULL,
//     email                  VARCHAR(255) NOT NULL,
//     status                 TEXT NOT NULL DEFAULT 'pending',
//     created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//     claimed_at             TIMESTAMPTZ
//   );
//
//   CREATE TABLE treasury_transfers_queue (
//     id                SERIAL PRIMARY KEY,
//     payment_id        INTEGER NOT NULL REFERENCES payments(id),
//     amount_usdt_owed  NUMERIC(10,4) NOT NULL,
//     destination       TEXT NOT NULL DEFAULT 'harjoot',
//     status            TEXT NOT NULL DEFAULT 'pending',
//     usdt_tx_hash      TEXT,
//     error             TEXT,
//     created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//     sent_at           TIMESTAMPTZ
//   );
//
// And the indexes that matter for hot-path queries.

require("dotenv").config();
const { sequelizeAdmin } = require("../models");

const STATEMENTS = [
  // ---- users: harjoot + educator approval columns ----
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS harjoot_membership_expires_at TIMESTAMPTZ`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS educator_approval_status TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT`,

  // ---- payments ----
  `CREATE TABLE IF NOT EXISTS payments (
    id                SERIAL PRIMARY KEY,
    tx_hash           TEXT UNIQUE NOT NULL,
    from_wallet       VARCHAR(42) NOT NULL,
    amount_hack       BIGINT NOT NULL,
    harjoot_price_usd NUMERIC(10,4) NOT NULL,
    user_price_usd    NUMERIC(10,4) NOT NULL,
    status            TEXT NOT NULL DEFAULT 'confirmed',
    purpose           TEXT NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_payments_from_wallet ON payments (from_wallet)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status)`,

  // ---- talent_invitations ----
  `CREATE TABLE IF NOT EXISTS talent_invitations (
    id                     SERIAL PRIMARY KEY,
    educator_user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_wallet_address VARCHAR(42) NOT NULL,
    email                  VARCHAR(255) NOT NULL,
    status                 TEXT NOT NULL DEFAULT 'pending',
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    claimed_at             TIMESTAMPTZ
  )`,
  `CREATE INDEX IF NOT EXISTS idx_invitations_wallet ON talent_invitations (student_wallet_address)`,
  `CREATE INDEX IF NOT EXISTS idx_invitations_status ON talent_invitations (status)`,
  `CREATE INDEX IF NOT EXISTS idx_invitations_educator ON talent_invitations (educator_user_id)`,

  // ---- treasury_transfers_queue ----
  `CREATE TABLE IF NOT EXISTS treasury_transfers_queue (
    id                SERIAL PRIMARY KEY,
    payment_id        INTEGER NOT NULL REFERENCES payments(id),
    amount_usdt_owed  NUMERIC(10,4) NOT NULL,
    destination       TEXT NOT NULL DEFAULT 'harjoot',
    status            TEXT NOT NULL DEFAULT 'pending',
    usdt_tx_hash      TEXT,
    error             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at           TIMESTAMPTZ
  )`,
  `CREATE INDEX IF NOT EXISTS idx_treasury_status ON treasury_transfers_queue (status)`,
  `CREATE INDEX IF NOT EXISTS idx_treasury_payment ON treasury_transfers_queue (payment_id)`,

  // ---- certificates: Harjoot proof + payment reference + status ----
  // payment_id references payments, which must exist before we add the column.
  `ALTER TABLE certificates ADD COLUMN IF NOT EXISTS harjoot_verification_id TEXT`,
  `ALTER TABLE certificates ADD COLUMN IF NOT EXISTS harjoot_verification_url TEXT`,
  `ALTER TABLE certificates ADD COLUMN IF NOT EXISTS harjoot_qr_url TEXT`,
  `ALTER TABLE certificates ADD COLUMN IF NOT EXISTS payment_id INTEGER REFERENCES payments(id)`,
  `ALTER TABLE certificates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'issued'`,
  `CREATE INDEX IF NOT EXISTS idx_certificates_payment ON certificates (payment_id)`,
  `CREATE INDEX IF NOT EXISTS idx_certificates_harjoot_verification ON certificates (harjoot_verification_id)`,
];

async function run() {
  console.log("[migrate-harjoot-phase1] starting");

  await sequelizeAdmin.authenticate();
  console.log("[migrate-harjoot-phase1] DB connection authenticated");

  for (const statement of STATEMENTS) {
    const oneLine = statement.replace(/\s+/g, " ").trim();
    const preview = oneLine.length > 90 ? oneLine.slice(0, 87) + "..." : oneLine;
    console.log(`[migrate-harjoot-phase1] applying: ${preview}`);
    await sequelizeAdmin.query(statement);
  }

  console.log(`[migrate-harjoot-phase1] done — ${STATEMENTS.length} statements applied (idempotent)`);
}

run()
  .then(async () => {
    await sequelizeAdmin.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("[migrate-harjoot-phase1] FAILED:", err);
    try { await sequelizeAdmin.close(); } catch (_) { /* ignore */ }
    process.exit(1);
  });
