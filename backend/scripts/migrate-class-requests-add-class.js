require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");
const { DataTypes } = require("sequelize");

async function run() {
  const q = sequelize.getQueryInterface();
  const columns = await q.describeTable("class_requests");

  if (!columns.issuer_class_id) {
    await q.addColumn("class_requests", "issuer_class_id", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "issuer_classes", key: "id" },
      onDelete: "SET NULL",
    });
    console.log("Added column: issuer_class_id");
  } else {
    console.log("Column already exists: issuer_class_id");
  }

  if (!columns.class_name) {
    await q.addColumn("class_requests", "class_name", {
      type: DataTypes.STRING(255),
      allowNull: true,
    });
    console.log("Added column: class_name");
  } else {
    console.log("Column already exists: class_name");
  }

  await sequelize.close();
  console.log("Migration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
