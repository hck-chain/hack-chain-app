require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");
const { DataTypes } = require("sequelize");

async function run() {
  const q = sequelize.getQueryInterface();
  const columns = await q.describeTable("class_requests");

  if (!columns.cancellation_reason) {
    await q.addColumn("class_requests", "cancellation_reason", {
      type: DataTypes.TEXT,
      allowNull: true,
    });
    console.log("Added column: cancellation_reason");
  } else {
    console.log("Column already exists: cancellation_reason");
  }

  await sequelize.close();
  console.log("Migration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
