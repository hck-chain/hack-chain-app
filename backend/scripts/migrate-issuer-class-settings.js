require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");
const { DataTypes } = require("sequelize");

async function run() {
  const q = sequelize.getQueryInterface();
  const columns = await q.describeTable("issuers");

  if (!columns.class_settings) {
    await q.addColumn("issuers", "class_settings", {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
    });
    console.log("Added column: class_settings");
  } else {
    console.log("Column already exists: class_settings");
  }

  await sequelize.close();
  console.log("Migration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
