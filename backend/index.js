require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const pg = require("pg");
const PgSession = require("connect-pg-simple")(session);
const cron = require("node-cron");
const db = require("./models");
const path = require("path");

const app = express();
const port = process.env.PORT || 3001;

// ---------- Trust proxy (Render, Vercel, etc.) ----------
app.set('trust proxy', 1); // Esto resuelve express-rate-limit en proxies

// ---------- CORS ----------
const allowedOrigins = [
 // "https://hackchain.app",
  "https://www.hackchain.app",
  ...(process.env.NODE_ENV !== "production" ? ["http://localhost:8080", "http://localhost:5173"] : []),
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`Bloqueado CORS desde origin: ${origin}`);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

// ---------- Middleware ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- Global rate limiter ----------
// Covers all /api/ routes. Specific limiters (login: 8/min, upload: 10/hr)
// apply on top of this for their own endpoints.
// Note: uses in-memory store per process — with PM2 cluster the effective
// limit scales with worker count. Add a Redis store if stricter cross-process
// enforcement is required.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.GLOBAL_RATE_LIMIT_MAX || "100", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});
app.use("/api/", globalLimiter);

// ---------- Rutas ----------
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const sessionsRouter = require("./routes/sessions");
const certificatesRouter = require("./routes/certificates");
const studentsRouter = require("./routes/students");
const issuersRouter = require("./routes/issuers");
const recruitersRouter = require("./routes/recruiters");
const opensea = require("./routes/opensea");
const uploadRoutes = require("./routes/upload");

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/certificates", certificatesRouter);
app.use("/api/students", studentsRouter);
app.use("/api/issuers", issuersRouter);
app.use("/api/recruiters", recruitersRouter);
app.use("/api/opensea", opensea);
app.use("/api/upload", uploadRoutes);

// Servir build Vite
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Redirigir todo lo demás a index.html (compatible con Express 4+)
// app.get('/*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
// });


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

    if (process.env.NODE_ENV !== "production") {
      await db.sequelizeAdmin.sync();
      console.log("✅ Database synchronized.");
    }

    server = app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`🔗 Frontend origin: https://www.hackchain.app`);
    });

    // Purge expired sessions every hour to keep UserSession table lean.
    cron.schedule("0 * * * *", async () => {
      try {
        const { Op } = db.Sequelize;
        const deleted = await db.UserSession.destroy({
          where: { expires_at: { [Op.lt]: new Date() } },
        });
        if (deleted > 0) console.log(`🧹 Purged ${deleted} expired session(s)`);
      } catch (err) {
        console.error("Session purge error:", err.message);
      }
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

module.exports = app;
