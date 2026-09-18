require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { sequelize } = require("../models");
const { DataTypes } = require("sequelize");

// wallet_address stays the system-wide identity key (NOT NULL, FK target of 11 columns
// across 9 tables). These columns only add the Privy identity and the two wallet roles
// on top of it, so no existing row or foreign key has to move.
async function run() {
  const q = sequelize.getQueryInterface();
  const columns = await q.describeTable("users");

  const toAdd = [
    {
      name: "privy_did",
      missing: !columns.privy_did,
      def: { type: DataTypes.STRING(100), allowNull: true },
    },
    {
      name: "integrated_wallet_address",
      missing: !columns.integrated_wallet_address,
      def: { type: DataTypes.STRING(42), allowNull: true },
    },
    {
      name: "own_wallet_address",
      missing: !columns.own_wallet_address,
      def: { type: DataTypes.STRING(42), allowNull: true },
    },
  ];

  for (const col of toAdd) {
    if (col.missing) {
      await q.addColumn("users", col.name, col.def);
      console.log(`Added column: users.${col.name}`);
    } else {
      console.log(`Column already exists: users.${col.name}`);
    }
  }

  // Partial unique indexes: the columns stay null until a user links a Privy identity
  // or connects a wallet, and null values must not collide with each other.
  const indexes = [
    { name: "users_privy_did_unique", column: "privy_did" },
    { name: "users_integrated_wallet_address_unique", column: "integrated_wallet_address" },
    { name: "users_own_wallet_address_unique", column: "own_wallet_address" },
  ];

  for (const index of indexes) {
    const [rows] = await sequelize.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'users' AND indexname = '${index.name}'
    `);

    if (rows.length === 0) {
      await sequelize.query(`
        CREATE UNIQUE INDEX ${index.name} ON users (${index.column})
        WHERE ${index.column} IS NOT NULL;
      `);
      console.log(`Created unique index: ${index.name}`);
    } else {
      console.log(`Index already exists: ${index.name}`);
    }
  }

  await sequelize.close();
  console.log("Migration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
