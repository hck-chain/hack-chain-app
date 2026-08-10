require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");
const { DataTypes } = require("sequelize");

async function addColumnIfMissing(q, table, column, spec) {
  const columns = await q.describeTable(table);
  if (!columns[column]) {
    await q.addColumn(table, column, spec);
    console.log(`Added column: ${table}.${column}`);
  } else {
    console.log(`Column already exists: ${table}.${column}`);
  }
}

async function run() {
  const q = sequelize.getQueryInterface();

  await addColumnIfMissing(q, "class_requests", "meeting_url", {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await sequelize.close();
  console.log("Migration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
