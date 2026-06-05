require("dotenv").config();
const helmet = require("helmet");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const cron = require("node-cron");
const db = require("./models");
const path = require("path");
const { getRedis } = require("./services/redis");

const app = express();
const port = process.env.PORT || 3001;

// ---------- Trust proxy (Render, Vercel, etc.) ----------
app.set('trust proxy', 1); // Esto resuelve express-rate-limit en proxies

// ---------- CORS ----------
const allowedOrigins = [
  "https://hackchain.app",
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
app.use(cookieParser());

// ---------- Global rate limiter ----------
// Covers all /api/ routes. Specific limiters (login: 8/min, upload: 10/hr)
// apply on top of this for their own endpoints.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.GLOBAL_RATE_LIMIT_MAX || "100", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
  store: new RedisStore({
    sendCommand: (...args) => getRedis().call(...args),
  }),
});
app.use("/api/", globalLimiter);


app.use(helmet({
  // CrossOriginEmbedderPolicy rompe el modal de AppKit (carga iframes de reown.com)
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      // unsafe-eval requerido por WalletConnect/AppKit internamente
      scriptSrc:      ["'self'", "'unsafe-eval'", "https://*.reown.com", "https://*.walletconnect.com"],
      styleSrc:       ["'self'", "'unsafe-inline'"],
      imgSrc:         ["'self'", "data:", "blob:", "https://gateway.pinata.cloud", "https://*.reown.com", "https://*.walletconnect.com"],
      fontSrc:        ["'self'", "data:"],
      connectSrc:     [
        "'self'",
        "https://*.reown.com",
        "https://verify.walletconnect.com",
        "wss://*.walletconnect.com",
        "wss://*.walletconnect.org",
        "https://gateway.pinata.cloud",
        "https://api.pinata.cloud",
        "https://polygon-rpc.com",
        "https://rpc.ankr.com",
        "https://www.hackchain.app",
        ...(process.env.NODE_ENV !== "production" ? ["http://localhost:8080", "http://localhost:3001"] : []),
      ],
      frameSrc:       ["'self'", "https://*.reown.com", "https://*.walletconnect.com"],
      workerSrc:      ["'self'", "blob:"],
      objectSrc:      ["'none'"],
      baseUri:        ["'self'"],
      formAction:     ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));



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
const adminRouter = require("./routes/admin");

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/certificates", certificatesRouter);
app.use("/api/students", studentsRouter);
app.use("/api/issuers", issuersRouter);
app.use("/api/recruiters", recruitersRouter);
app.use("/api/opensea", opensea);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRouter);

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

    // Add email verification columns to users if they don't exist yet
    await db.sequelizeAdmin.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS verification_token VARCHAR(128),
        ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ;
    `);
    console.log("Email verification columns ensured.");

    // ----------------------------------------------------------------------
    // DS Section 0 — Harjoot partner health check.
    // Confirms the partner API key is valid and caches the partner config in
    // memory. The use case never throws — Harjoot being unreachable must NOT
    // block server startup. See backend/harjoot/usecases/checkPartnerHealth.js.
    // ----------------------------------------------------------------------
    const { createHarjootClient } = require("./harjoot/client");
    const { checkPartnerHealth } = require("./harjoot/usecases/checkPartnerHealth");
    await checkPartnerHealth(createHarjootClient());

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


    // DS Section 13 — async Treasury -> Harjoot settlement worker.
    // Drains `treasury_transfers_queue` every 10 minutes. The launch
    // strategy is `manual` (env: TREASURY_CONVERSION_MODE), which parks
    // each batch as `awaiting_manual_conversion` for the CTO/ops to
    // settle out of band — no on-chain action is taken automatically.
    // See backend/workers/treasuryForwarder.js + harjoot/strategies/.
    require("./workers/treasuryForwarder").scheduleTreasuryForwarder();

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
