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

// Rutas
const authRouter = require("./routes/auth");
const certificatesRouter = require("./routes/certificates");
const studentRouter = require("./routes/students");
const issuerRouter = require("./routes/issuers");
const recruiterRouter = require("./routes/recruiters");
const profileRouter = require("./routes/profile");

const app = express();
const port = parseInt(process.env.PORT || "3002", 10);

// Opcional: si vas a correr detrás de un proxy (nginx, heroku, etc.)
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

// CORS: permitir credenciales (cookies) para sesiones entre frontend y backend.
// Ajusta FRONTEND_ORIGIN en tu .env (por ejemplo http://localhost:3000)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}));

// Body parser (JSON) - reemplaza body-parser moderno
app.use(express.json());

// -------- Session store en Postgres --------
// Pool de Postgres para el store de sesiones
const pgPool = new pg.Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "hackchain",
  // En producción, considera agregar SSL/tls y opciones de timeout.
});

const SESSION_SECRET = process.env.SESSION_SECRET || "change-me-in-production";
const SESSION_NAME = process.env.SESSION_NAME || "hackchain.sid";

app.use(session({
  store: new PgSession({
    pool: pgPool,        // pool (obligatorio)
    tableName: 'session' // tabla donde se guardarán las sesiones
    // Si quieres que se cree automáticamente la tabla:
    // createTableIfMissing: true  (consulta la doc de connect-pg-simple)
  }),
  name: SESSION_NAME,
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // en prod el cookie debe ser secure
    sameSite: process.env.NODE_ENV === "production" ? "Strict" : "Lax",
    maxAge: 24 * 60 * 60 * 1000 // 1 día
  }
}));
// ------------------------------------------

// Montar rutas principales
app.use("/api/auth", authRouter);
app.use("/api/certificates", certificatesRouter);
app.use("/api/student", studentRouter);
app.use("/api/issuer", issuerRouter);
app.use("/api/recruiter", recruiterRouter);
app.use("/api/profile", profileRouter);

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
      console.log(`🔗 Frontend origin: ${FRONTEND_ORIGIN}`);
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
