// backend/index.js
// Cargar variables de entorno lo antes posible
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const pg = require("pg");
const PgSession = require("connect-pg-simple")(session);
const db = require("./models"); // Sequelize models (db.sequelize)
const path = require("path");

const app = express();
const port = process.env.PORT || 3001;

// ---------- CORS ----------
// Solo permitir tu dominio de frontend
const allowedOrigins = [
  "https://hackchain.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (Postman, server-side)
    if (!origin) return callback(null, true);

    // Permitir solo tu dominio
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`🚫 Bloqueado CORS desde origin: ${origin}`);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

// ---------- Middleware ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- Rutas ----------
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const sessionsRouter = require("./routes/sessions");
const certificatesRouter = require("./routes/certificates");
const studentsRouter = require("./routes/students");
const issuersRouter = require("./routes/issuers");
const recruitersRouter = require("./routes/recruiters");
const opensea = require("./routes/opensea");

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/certificates", certificatesRouter);
app.use("/api/students", studentsRouter);
app.use("/api/issuers", issuersRouter);
app.use("/api/recruiters", recruitersRouter);
app.use("/api/opensea", opensea);

// ---------- Health check ----------
app.get("/health", async (req, res) => {
  try {
    await db.sequelize.authenticate();
    return res.json({ ok: true, db: "reachable" });
  } catch (err) {
    console.error("Health check - DB error:", err);
    return res.status(500).json({ ok: false, db: "unreachable", error: err.message });
  }
});

// ---------- 404 ----------
app.use((req, res, next) => {
  res.status(404).json({ error: "Not found" });
});

// ---------- Error handler ----------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err && err.stack ? err.stack : err);
  const status = err.status && Number(err.status) || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

// ---------- Arrancar servidor ----------
let server;
(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("✅ Database connection authenticated.");

    await db.sequelize.sync();
    console.log("✅ Database synchronized.");

    server = app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`🔗 Frontend origin: https://hackchain.app`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();

// ---------- Graceful shutdown ----------
async function shutdown(signal) {
  console.log(`\n⚠️  Received ${signal}. Shutting down gracefully...`);
  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      console.log("HTTP server closed.");
    }
    if (db && db.sequelize) {
      await db.sequelize.close();
      console.log("Sequelize connection closed.");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Export app para tests (supertest) si se necesita
module.exports = app;
