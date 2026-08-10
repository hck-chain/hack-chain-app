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

  await addColumnIfMissing(q, "class_requests", "currency", {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: "USDT",
  });

  await addColumnIfMissing(q, "class_requests", "amount", {
    type: DataTypes.DECIMAL(28, 8),
    allowNull: true,
  });

  await addColumnIfMissing(q, "class_requests", "payment_network", {
    type: DataTypes.STRING(30),
    allowNull: true,
  });

  await addColumnIfMissing(q, "class_requests", "deposit_proof_url", {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await addColumnIfMissing(q, "class_requests", "deposit_proof_cid", {
    type: DataTypes.STRING(255),
    allowNull: true,
  });

  await addColumnIfMissing(q, "class_requests", "final_proof_url", {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await addColumnIfMissing(q, "class_requests", "final_proof_cid", {
    type: DataTypes.STRING(255),
    allowNull: true,
  });

  await addColumnIfMissing(q, "class_requests", "deposit_confirmed_at", {
    type: DataTypes.DATE,
    allowNull: true,
  });

  await addColumnIfMissing(q, "class_requests", "final_confirmed_at", {
    type: DataTypes.DATE,
    allowNull: true,
  });

  await addColumnIfMissing(q, "certificates", "confirmation_deadline", {
    type: DataTypes.DATE,
    allowNull: true,
  });

  await addColumnIfMissing(q, "certificates", "flag_reason", {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  const tables = await q.showAllTables();
  const tableNames = tables.map((t) => (typeof t === "string" ? t : t.tableName));
  if (!tableNames.includes("class_payment_disputes")) {
    await q.createTable("class_payment_disputes", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      class_request_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "class_requests", key: "id" },
        onDelete: "CASCADE",
      },
      dispute_type: { type: DataTypes.STRING(10), allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "open" },
      opened_by_wallet: { type: DataTypes.STRING(42), allowNull: false },
      resolution_note: { type: DataTypes.TEXT, allowNull: true },
      resolved_by_wallet: { type: DataTypes.STRING(42), allowNull: true },
      resolved_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    console.log("Created table: class_payment_disputes");
  } else {
    console.log("Table already exists: class_payment_disputes");
  }

  await sequelize.close();
  console.log("Migration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
