require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");
const { DataTypes } = require("sequelize");

// certificate_hash, token_id, and issue_date become nullable so a certificate
// can be reserved (status: 'pending') before it has real chain data. The
// existing unique index on certificate_hash is untouched — Postgres allows
// multiple NULLs in a unique column, so several pending rows can coexist.
// changeColumn is idempotent: re-running DROP NOT NULL on an already-nullable
// column is a no-op in Postgres.
async function run() {
  const q = sequelize.getQueryInterface();

  await q.changeColumn("certificates", "certificate_hash", {
    type: DataTypes.STRING(128),
    unique: true,
    allowNull: true,
  });
  console.log("certificate_hash is now nullable");

  await q.changeColumn("certificates", "token_id", {
    type: DataTypes.STRING(78),
    allowNull: true,
  });
  console.log("token_id is now nullable");

  await q.changeColumn("certificates", "issue_date", {
    type: DataTypes.DATEONLY,
    allowNull: true,
  });
  console.log("issue_date is now nullable");

  await sequelize.close();
  console.log("Migration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
