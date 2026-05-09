require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");
const { DataTypes } = require("sequelize");

async function run() {
  const q = sequelize.getQueryInterface();
  const columns = await q.describeTable("issuers");

  const toAdd = [
    {
      name: "website_url",
      missing: !columns.website_url,
      def: { type: DataTypes.STRING(500), allowNull: true },
    },
    {
      name: "linkedin_url",
      missing: !columns.linkedin_url,
      def: { type: DataTypes.STRING(500), allowNull: true },
    },
    {
      name: "twitter_url",
      missing: !columns.twitter_url,
      def: { type: DataTypes.STRING(500), allowNull: true },
    },
  ];

  for (const col of toAdd) {
    if (col.missing) {
      await q.addColumn("issuers", col.name, col.def);
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
