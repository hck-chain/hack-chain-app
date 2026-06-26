require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");

(async () => {
  try {
    await sequelize.query(`
      ALTER TABLE class_requests
      ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;
    `);
    console.log("Migration complete: reminder_sent added to class_requests.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();
