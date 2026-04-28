require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");

async function run() {
  const q = sequelize.getQueryInterface();

  const columns = await q.describeTable("issuers");

  const toAdd = [
    {
      name: "photo_url",
      missing: !columns.photo_url,
      def: { type: require("sequelize").DataTypes.STRING(500), allowNull: true },
    },
    {
      name: "bio",
      missing: !columns.bio,
      def: { type: require("sequelize").DataTypes.TEXT, allowNull: true },
    },
    {
      name: "knowledge_areas",
      missing: !columns.knowledge_areas,
      def: { type: require("sequelize").DataTypes.JSONB, allowNull: true, defaultValue: [] },
    },
  ];

  for (const col of toAdd) {
    if (col.missing) {
      await q.addColumn("issuers", col.name, col.def);
      console.log(`✅ Added column: ${col.name}`);
    } else {
      console.log(`⏭  Column already exists: ${col.name}`);
    }
  }

  await sequelize.close();
  console.log("Migration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
