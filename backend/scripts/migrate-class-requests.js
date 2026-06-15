require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");
const { DataTypes } = require("sequelize");

async function run() {
  const q = sequelize.getQueryInterface();
  const tables = await q.showAllTables();

  if (!tables.includes("class_requests")) {
    await q.createTable("class_requests", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      student_wallet_address: {
        type: DataTypes.STRING(42),
        allowNull: false,
        references: { model: "users", key: "wallet_address" },
        onDelete: "CASCADE",
      },
      issuer_wallet_address: {
        type: DataTypes.STRING(42),
        allowNull: false,
        references: { model: "issuers", key: "wallet_address" },
        onDelete: "CASCADE",
      },
      requested_date: { type: DataTypes.DATEONLY, allowNull: false },
      start_time: { type: DataTypes.STRING(5), allowNull: false },
      duration_minutes: { type: DataTypes.INTEGER, allowNull: false },
      hourly_rate_usd: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      student_message: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "pending",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
    console.log("Created table: class_requests");
  } else {
    console.log("Table already exists: class_requests");
  }

  await sequelize.close();
  console.log("Migration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
