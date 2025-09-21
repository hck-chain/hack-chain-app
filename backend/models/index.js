// backend/models/index.js
const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config(); // por seguridad, aunque index.js ya lo carga

// Forzar tipos y valores por defecto
const dbName = process.env.DB_NAME || "hackchain";
const dbUser = process.env.DB_USER || "postgres";
const dbPassword = (process.env.DB_PASSWORD === undefined || process.env.DB_PASSWORD === null)
  ? undefined
  : String(process.env.DB_PASSWORD);
const dbHost = process.env.DB_HOST || "localhost";
const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;

const sequelize = new Sequelize(
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
