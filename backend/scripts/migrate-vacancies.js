require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");
const { DataTypes } = require("sequelize");
const { VACANCY_AREAS } = require("../usecases/vacancies/constants");

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
  const tables = await q.showAllTables();
  const tableNames = tables.map((t) => (typeof t === "string" ? t : t.tableName));

  // Recruiter public-profile columns (§3.3 of the PDF). slug gets a partial
  // unique index below (same pattern as scripts/migrate-email-unique.js) so
  // it can stay NULL while existing recruiters haven't backfilled one yet.
  await addColumnIfMissing(q, "recruiters", "slug", {
    type: DataTypes.STRING(120),
    allowNull: true,
  });
  await addColumnIfMissing(q, "recruiters", "description", {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  await addColumnIfMissing(q, "recruiters", "country", {
    type: DataTypes.STRING(100),
    allowNull: true,
  });

  const [slugIndexRows] = await sequelize.query(`
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'recruiters' AND indexname = 'recruiters_slug_unique'
  `);
  if (slugIndexRows.length === 0) {
    await sequelize.query(`
      CREATE UNIQUE INDEX recruiters_slug_unique ON recruiters (slug) WHERE slug IS NOT NULL;
    `);
    console.log("Created unique index: recruiters_slug_unique");
  } else {
    console.log("Index already exists: recruiters_slug_unique");
  }

  if (!tableNames.includes("vacancies")) {
    await q.createTable("vacancies", {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      recruiter_wallet_address: {
        type: DataTypes.STRING(42),
        allowNull: false,
        references: { model: "users", key: "wallet_address" },
        onDelete: "CASCADE",
      },
      position: { type: DataTypes.STRING(80), allowNull: false },
      company: { type: DataTypes.STRING(80), allowNull: false },
      area: { type: DataTypes.ENUM(...VACANCY_AREAS), allowNull: false },
      modality: { type: DataTypes.STRING(20), allowNull: false },
      country: { type: DataTypes.STRING(100), allowNull: true },
      city: { type: DataTypes.STRING(100), allowNull: true },
      salary_min: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      salary_max: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      salary_currency: { type: DataTypes.STRING(10), allowNull: false },
      salary_period: { type: DataTypes.STRING(20), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      requirements: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      closing_date: { type: DataTypes.DATEONLY, allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "abierta" },
      published_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      closed_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    console.log("Created table: vacancies");
  } else {
    console.log("Table already exists: vacancies");
  }

  if (!tableNames.includes("vacancy_applications")) {
    await q.createTable("vacancy_applications", {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      vacancy_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "vacancies", key: "id" },
        onDelete: "CASCADE",
      },
      student_wallet_address: {
        type: DataTypes.STRING(42),
        allowNull: false,
        references: { model: "users", key: "wallet_address" },
        onDelete: "CASCADE",
      },
      shared_certificates: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      message: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "enviada" },
      submitted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      viewed_at: { type: DataTypes.DATE, allowNull: true },
      status_changed_at: { type: DataTypes.DATE, allowNull: true },
      status_changed_by: { type: DataTypes.STRING(42), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    console.log("Created table: vacancy_applications");
  } else {
    console.log("Table already exists: vacancy_applications");
  }

  // RF-19 / RN: one application per talent per vacancy.
  const [appIndexRows] = await sequelize.query(`
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'vacancy_applications' AND indexname = 'vacancy_applications_vacancy_student_unique'
  `);
  if (appIndexRows.length === 0) {
    await sequelize.query(`
      CREATE UNIQUE INDEX vacancy_applications_vacancy_student_unique
      ON vacancy_applications (vacancy_id, student_wallet_address);
    `);
    console.log("Created unique index: vacancy_applications_vacancy_student_unique");
  } else {
    console.log("Index already exists: vacancy_applications_vacancy_student_unique");
  }

  await sequelize.close();
  console.log("Migration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
