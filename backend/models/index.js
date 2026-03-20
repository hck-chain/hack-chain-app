// backend/models/index.js
const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config(); // por seguridad, aunque index.js ya lo carga

// Use DATABASE_URL if available (Vercel/Neon), otherwise fall back to individual vars
const databaseUrl = process.env.DB_DATABASE_URL || process.env.DB_POSTGRES_URL;

let sequelize;
if (databaseUrl) {
  // Use connection string from Vercel/Neon
  sequelize = new Sequelize(databaseUrl, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  // Fallback to individual environment variables
  const dbName = process.env.DB_PGDATABASE || process.env.DB_NAME || "hackchain";
  const dbUser = process.env.DB_PGUSER || process.env.DB_USER || "postgres";
  const dbPassword = process.env.DB_PGPASSWORD || process.env.DB_PASSWORD;
  const dbHost = process.env.DB_PGHOST || process.env.DB_HOST || "localhost";
  const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;

  sequelize = new Sequelize(
    dbName,
    dbUser,
    dbPassword,
    {
      host: dbHost,
      port: dbPort,
      dialect: "postgres",
      logging: false,
    }
  );
}

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

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
