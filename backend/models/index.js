// backend/models/index.js
const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

// DATABASE_URL       → Neon pooled endpoint (PgBouncer). Used for all app queries.
//                      Add this to Render once taken from the Neon dashboard.
// DATABASE_URL_UNPOOLED → Neon direct endpoint. Used for DDL (sequelize.sync) only,
//                      because PgBouncer in transaction mode doesn't support DDL well.
// pg-connection-string v3 deprecates 'sslmode=require' — replace with 'sslmode=verify-full'
// to keep current behavior and silence the security warning.
function normalizeSslMode(url) {
  if (!url) return url;
  return url.replace(/sslmode=require/g, 'sslmode=verify-full');
}

const pooledUrl   = normalizeSslMode(process.env.DATABASE_URL);
// DATABASE_URL_UNPOOLED → Neon's name in Render
// DB_DATABASE_URL       → legacy name used in local .env
const directUrl   = normalizeSslMode(process.env.DATABASE_URL_UNPOOLED || process.env.DB_DATABASE_URL);

// Fallback chain for individual vars (local dev without Neon URLs).
function buildIndividualConfig() {
  return {
    database: process.env.DB_PGDATABASE || process.env.DB_NAME || "hackchain",
    username: process.env.DB_PGUSER    || process.env.DB_USER  || "postgres",
    password: process.env.DB_PGPASSWORD || process.env.DB_PASSWORD,
    host:     process.env.DB_PGHOST    || process.env.DB_HOST,
    port:     process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  };
}

const sslOptions = { rejectUnauthorized: false };

// Pool for regular queries — generous size for concurrent requests.
const queryPoolConfig = { max: 20, min: 2, acquire: 30000, idle: 10000 };
// DDL connection doesn't need a pool; a single connection is enough.
const ddlPoolConfig   = { max: 1,  min: 0, acquire: 30000, idle: 10000 };

function makeSequelize(url, pool) {
  if (url) {
    return new Sequelize(url, {
      dialect: "postgres",
      logging: false,
      pool,
      dialectOptions: { ssl: sslOptions },
    });
  }
  const { database, username, password, host, port } = buildIndividualConfig();
  return new Sequelize(database, username, password, {
    host, port,
    dialect: "postgres",
    logging: false,
    pool,
  });
}

// Main instance — pooled when DATABASE_URL is set, direct otherwise.
const sequelize = makeSequelize(pooledUrl || directUrl, queryPoolConfig);

// Admin instance — always direct to avoid PgBouncer DDL restrictions.
// If URLs are the same (DATABASE_URL not set yet), reuse the main instance.
const sequelizeAdmin = (directUrl && directUrl !== (pooledUrl || directUrl))
  ? makeSequelize(directUrl, ddlPoolConfig)
  : sequelize;

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.sequelizeAdmin = sequelizeAdmin;

db.User = require("./users")(sequelize, DataTypes);
db.Student = require("./students")(sequelize, DataTypes);
db.Issuer = require("./issuers")(sequelize, DataTypes);
db.Recruiter = require("./recruiters")(sequelize, DataTypes);
db.Certificate = require("./certificates")(sequelize, DataTypes);
db.UserSession = require("./userSessions")(sequelize, DataTypes);

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
