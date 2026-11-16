// backend/scripts/migrate-presale.js
//
// Crea la tabla de aportes de la preventa. Idempotente: se puede correr las
// veces que haga falta, no toca nada si ya existe.
//
//   npm run migrate:presale
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");
const { DataTypes } = require("sequelize");

async function run() {
  const q = sequelize.getQueryInterface();
  const tables = await q.showAllTables();
  const tableNames = tables.map((t) => (typeof t === "string" ? t : t.tableName));

  if (!tableNames.includes("presale_contributions")) {
    await q.createTable("presale_contributions", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      wallet_address: { type: DataTypes.STRING(42), allowNull: false },
      phase_id: { type: DataTypes.INTEGER, allowNull: false },
      // DECIMAL y no FLOAT: son montos de dinero.
      usdt_amount: { type: DataTypes.DECIMAL(18, 6), allowNull: false },
      // HACK enteros, no wei. La conversion a 18 decimales se hace al exportar
      // el lote para PresaleAllocation.allocateBatch.
      hack_amount: { type: DataTypes.DECIMAL(38, 0), allowNull: false },
      // Unico: impide que el mismo pago se registre dos veces.
      tx_hash: { type: DataTypes.STRING(66), allowNull: true, unique: true },
      // CID de Pinata. El archivo vive en IPFS, nunca en nuestro disco.
      proof_cid: { type: DataTypes.STRING(100), allowNull: true },
      proof_uri: { type: DataTypes.STRING(255), allowNull: true },
      status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "pending" },
      rejection_reason: { type: DataTypes.STRING(255), allowNull: true },
      validated_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.fn("NOW") },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.fn("NOW") },
    });
    console.log("Created table: presale_contributions");
  } else {
    console.log("Table already exists: presale_contributions");
  }

  // Columnas de auditoria del panel de admin. addColumn idempotente para
  // bases que ya tenian la tabla de la primera version.
  const columns = await q.describeTable("presale_contributions");
  const nuevas = {
    reviewed_by: { type: DataTypes.STRING(42), allowNull: true },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
    onchain_amount_usdt: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
    declared_phase_id: { type: DataTypes.INTEGER, allowNull: true },
    declared_hack_amount: { type: DataTypes.DECIMAL(38, 0), allowNull: true },
    payment_block_time: { type: DataTypes.DATE, allowNull: true },
    payment_sender: { type: DataTypes.STRING(42), allowNull: true },
    manual_review_note: { type: DataTypes.STRING(500), allowNull: true },
  };
  for (const [col, spec] of Object.entries(nuevas)) {
    if (!columns[col]) {
      await q.addColumn("presale_contributions", col, spec);
      console.log(`Added column: presale_contributions.${col}`);
    } else {
      console.log(`Column already exists: presale_contributions.${col}`);
    }
  }

  const indexes = [
    // El comprador busca su propio aporte por direccion.
    ["presale_contributions_wallet_address_idx", "wallet_address"],
    // El listado publico filtra siempre por status='validated'.
    ["presale_contributions_status_idx", "status"],
  ];

  for (const [name, column] of indexes) {
    const [rows] = await sequelize.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'presale_contributions' AND indexname = '${name}'`
    );
    if (rows.length === 0) {
      await sequelize.query(`CREATE INDEX ${name} ON presale_contributions (${column});`);
      console.log(`Created index: ${name}`);
    } else {
      console.log(`Index already exists: ${name}`);
    }
  }
}

run()
  .then(async () => {
    await sequelize.close();
    console.log("Presale migration done.");
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Presale migration failed:", err);
    await sequelize.close();
    process.exit(1);
  });
