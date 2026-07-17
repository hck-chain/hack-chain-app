require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");

// certificate_hash, token_id, and issue_date become nullable so a certificate
// can be reserved (status: 'pending') before it has real chain data. The
// existing unique index on certificate_hash is untouched — Postgres allows
// multiple NULLs in a unique column, so several pending rows can coexist.
//
// Raw "DROP NOT NULL" only — deliberately not using Sequelize's changeColumn,
// which always emits a full "ALTER COLUMN ... TYPE ..." even when the type
// isn't changing. Production has a view (certificates_editable, not tracked
// anywhere in this repo) that depends on these columns, and Postgres refuses
// to alter a column's type while a view depends on it. Dropping NOT NULL
// doesn't touch the column type, so it doesn't hit that restriction.
// Idempotent: re-running DROP NOT NULL on an already-nullable column is a
// no-op in Postgres.
async function run() {
  await sequelize.query(`ALTER TABLE "certificates" ALTER COLUMN "certificate_hash" DROP NOT NULL`);
  console.log("certificate_hash is now nullable");

  await sequelize.query(`ALTER TABLE "certificates" ALTER COLUMN "token_id" DROP NOT NULL`);
  console.log("token_id is now nullable");

  await sequelize.query(`ALTER TABLE "certificates" ALTER COLUMN "issue_date" DROP NOT NULL`);
  console.log("issue_date is now nullable");

  await sequelize.close();
  console.log("Migration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
