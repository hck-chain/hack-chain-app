require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");
const { DataTypes } = require("sequelize");

async function run() {
  const q = sequelize.getQueryInterface();
  const columns = await q.describeTable("students");

  const toAdd = [
    { name: "photo_url", missing: !columns.photo_url, def: { type: DataTypes.STRING(500), allowNull: true } },
    { name: "bio", missing: !columns.bio, def: { type: DataTypes.TEXT, allowNull: true } },
    {
      name: "knowledge_areas",
      missing: !columns.knowledge_areas,
      def: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    },
    { name: "github_url", missing: !columns.github_url, def: { type: DataTypes.STRING(500), allowNull: true } },
    { name: "linkedin_url", missing: !columns.linkedin_url, def: { type: DataTypes.STRING(500), allowNull: true } },
    { name: "twitter_url", missing: !columns.twitter_url, def: { type: DataTypes.STRING(500), allowNull: true } },
    { name: "instagram_url", missing: !columns.instagram_url, def: { type: DataTypes.STRING(500), allowNull: true } },
    {
      name: "share_count",
      missing: !columns.share_count,
      // defaultValue backfills existing rows so the NOT NULL add succeeds.
      def: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
  ];

  for (const col of toAdd) {
    if (col.missing) {
      await q.addColumn("students", col.name, col.def);
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
