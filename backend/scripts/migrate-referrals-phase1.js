// backend/scripts/migrate-referrals-phase1.js
//
// Phase 1 schema migration for the Referrals system.
// Idempotent — safe to run multiple times. Uses IF NOT EXISTS guards on every
// CREATE/ALTER so re-runs are no-ops.
//
// Run with:
//   npm run migrate:referrals-phase1
//

require("dotenv").config();
const { sequelizeAdmin } = require("../models");

const STATEMENTS = [
  // ---- users: referral_code column ----
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(8)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users (referral_code)`,

  // ---- referrals ----
  `CREATE TABLE IF NOT EXISTS referrals (
    id                       SERIAL PRIMARY KEY,
    referrer_user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    referred_user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    referral_code_used       VARCHAR(8) NOT NULL,
    status                   VARCHAR(32) NOT NULL DEFAULT 'pending_stake'
                             CHECK (status IN ('pending_stake','staking','eligible','queued_next_month','claimed','expired','cancelled')),
    staking_started_at       TIMESTAMPTZ NULL,
    eligible_at              TIMESTAMPTZ NULL,
    queued_for_month         CHAR(7) NULL,
    payout_tx_hash           VARCHAR(66) UNIQUE NULL,
    payout_amount_wei        VARCHAR(80) NULL,
    claimed_at               TIMESTAMPTZ NULL,
    referral_ip_hash         VARCHAR(64) NULL,
    referral_user_agent_hash VARCHAR(64) NULL,
    requires_review          BOOLEAN NOT NULL DEFAULT false,
    review_reason            VARCHAR(255) NULL,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (referrer_user_id <> referred_user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_referrals_referrer_created ON referrals (referrer_user_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_referrals_status_eligible ON referrals (status, eligible_at)`,
  `CREATE INDEX IF NOT EXISTS idx_referrals_status_queued ON referrals (status, queued_for_month)`,
  `CREATE INDEX IF NOT EXISTS idx_referrals_requires_review ON referrals (requires_review) WHERE requires_review = true`,

  // ---- incentives_pool_ledger ----
  `CREATE TABLE IF NOT EXISTS incentives_pool_ledger (
    id                SERIAL PRIMARY KEY,
    referral_id       INTEGER NULL REFERENCES referrals(id) ON DELETE SET NULL,
    user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount_wei        VARCHAR(80) NOT NULL,
    tx_hash           VARCHAR(66) NOT NULL UNIQUE,
    category          VARCHAR(50) NOT NULL DEFAULT 'referral_reward',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_incentives_pool_ledger_user ON incentives_pool_ledger (user_id)`
];

async function run() {
  console.log("[migrate-referrals-phase1] starting");

  await sequelizeAdmin.authenticate();
  console.log("[migrate-referrals-phase1] DB connection authenticated");

  for (const statement of STATEMENTS) {
    const oneLine = statement.replace(/\\s+/g, " ").trim();
    const preview = oneLine.length > 90 ? oneLine.slice(0, 87) + "..." : oneLine;
    console.log(`[migrate-referrals-phase1] applying: ${preview}`);
    await sequelizeAdmin.query(statement);
  }

  console.log(`[migrate-referrals-phase1] done — ${STATEMENTS.length} statements applied (idempotent)`);
}

run()
  .then(async () => {
    await sequelizeAdmin.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("[migrate-referrals-phase1] FAILED:", err);
    try { await sequelizeAdmin.close(); } catch (_) { /* ignore */ }
    process.exit(1);
  });
