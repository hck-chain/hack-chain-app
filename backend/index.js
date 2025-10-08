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

app.use(cors());
app.use(express.json());

// Import routes
const usersRouter = require("./routes/users");
const sessionsRouter = require("./routes/sessions");
const certificatesRouter = require("./routes/certificates");
const studentsRouter = require("./routes/students");
const issuersRouter = require("./routes/issuers");
const recruitersRouter = require("./routes/recruiters");

// Use routes
app.use("/api/users", usersRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/certificates", certificatesRouter);
app.use("/api/students", studentsRouter);
app.use("/api/issuers", issuersRouter);
app.use("/api/recruiters", recruitersRouter);

// Health check básico: verifica que la app está viva y la DB responde
app.get("/health", async (req, res) => {
  try {
    await db.sequelize.authenticate();
    return res.json({ ok: true, db: "reachable" });
  } catch (err) {
    console.error("Health check - DB error:", err);
    return res.status(500).json({ ok: false, db: "unreachable", error: err.message });
  }
});

// 404 handler (si no coincide ninguna ruta)
app.use((req, res, next) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler (middleware final)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err && err.stack ? err.stack : err);
  const status = err.status && Number(err.status) || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

// Sincronizar DB y arrancar servidor
let server;
(async () => {
  try {
    // 1) Intentar autenticar la conexión (detecta credenciales/host/puerto incorrectos)
    await db.sequelize.authenticate();
    console.log("✅ Database connection authenticated.");

    // 2) Sync (si prefieres migraiones en lugar de sync(), cámbialo)
    await db.sequelize.sync();
    console.log("✅ Database synchronized.");

    // 3) Arrancar servidor
    server = app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`🔗 Frontend origin: ${process.env.FRONTEND_ORIGIN}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    // cierra pool si hay error y sal del proceso
    try { await pgPool.end(); } catch (e) { /* ignore */ }
    process.exit(1);
  }
})();

// Graceful shutdown: cierra servidor y pool de DB
async function shutdown(signal) {
  console.log(`\n⚠️  Received ${signal}. Shutting down gracefully...`);
  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      console.log("HTTP server closed.");
    }
    await pgPool.end();
    console.log("Postgres pool closed.");
    // cerrar sequelize
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
