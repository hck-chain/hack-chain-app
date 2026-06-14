require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");

async function run() {
  const q = sequelize.getQueryInterface();

  // Check if the unique index already exists
  const [rows] = await sequelize.query(`
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'users_email_unique'
  `);

  if (rows.length === 0) {
    // Partial unique index: only enforce uniqueness when email is not null
    await sequelize.query(`
      CREATE UNIQUE INDEX users_email_unique ON users (email) WHERE email IS NOT NULL;
    `);
    console.log("Created unique index: users_email_unique");
  } else {
    console.log("Index already exists: users_email_unique");
  }

  await sequelize.close();
  console.log("Migration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
