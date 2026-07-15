require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");
const { DataTypes } = require("sequelize");

async function run() {
  const q = sequelize.getQueryInterface();
  const columns = await q.describeTable("certificates");

  const toAdd = [
    {
      name: "share_count",
      missing: !columns.share_count,
      // defaultValue backfills existing rows so the NOT NULL add succeeds.
      def: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
  ];

  for (const col of toAdd) {
    if (col.missing) {
      await q.addColumn("certificates", col.name, col.def);
      console.log(`Added column: ${col.name}`);
    } else {
      console.log(`Column already exists: ${col.name}`);
    }
  }

  await sequelize.close();
  console.log("Migration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
