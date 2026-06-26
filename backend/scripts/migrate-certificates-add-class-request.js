require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");
const { DataTypes } = require("sequelize");

async function run() {
  const q = sequelize.getQueryInterface();
  const columns = await q.describeTable("certificates");

  if (!columns.class_request_id) {
    await q.addColumn("certificates", "class_request_id", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "class_requests", key: "id" },
      onDelete: "SET NULL",
    });
    console.log("Added column: class_request_id");
  } else {
    console.log("Column already exists: class_request_id");
  }

  await sequelize.close();
  console.log("Migration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
