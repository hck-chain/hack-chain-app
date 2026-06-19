require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");
const { DataTypes } = require("sequelize");

async function run() {
  const q = sequelize.getQueryInterface();
  const columns = await q.describeTable("class_requests");

  // payment_status — tracks where the funds are in the escrow lifecycle
  if (!columns.payment_status) {
    await q.addColumn("class_requests", "payment_status", {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "unpaid",
    });
    console.log("Added column: payment_status");
  } else {
    console.log("Column already exists: payment_status");
  }

  // amount_hack — agreed $HACK token amount for this class session
  if (!columns.amount_hack) {
    await q.addColumn("class_requests", "amount_hack", {
      type: DataTypes.DECIMAL(28, 8),
      allowNull: true,
    });
    console.log("Added column: amount_hack");
  } else {
    console.log("Column already exists: amount_hack");
  }

  // escrow_tx_hash — on-chain tx hash of the talent's deposit into HackEscrow
  if (!columns.escrow_tx_hash) {
    await q.addColumn("class_requests", "escrow_tx_hash", {
      type: DataTypes.STRING(66),
      allowNull: true,
    });
    console.log("Added column: escrow_tx_hash");
  } else {
    console.log("Column already exists: escrow_tx_hash");
  }

  // release_tx_hash — on-chain tx hash of the release (to educator) or refund (to talent)
  if (!columns.release_tx_hash) {
    await q.addColumn("class_requests", "release_tx_hash", {
      type: DataTypes.STRING(66),
      allowNull: true,
    });
    console.log("Added column: release_tx_hash");
  } else {
    console.log("Column already exists: release_tx_hash");
  }

  await sequelize.close();
  console.log("Migration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
