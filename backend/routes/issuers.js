// backend/routes/issuers.js
const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const buildRateLimitStore = require("../lib/rateLimitStore");
const { Issuer, User, Certificate, ClassRequest, Sequelize } = require("../models");
const { authorizeIssuer } = require("../services/authorizeIssuer.js");
const { validateDeletionMessage, deleteIssuerAccount } = require("../services/issuerService");
const { getFeaturedIssuers } = require("../services/issuerDiscoveryService");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");
const emailService = require("../services/emailService");
const { getAdminEmails } = require("../services/adminService");
const { getOwnClassSettings } = require("../usecases/issuers/getOwnClassSettings");
const { updateClassSettings } = require("../usecases/issuers/updateClassSettings");
const { getOwnIssuerProfile } = require("../usecases/issuers/getOwnIssuerProfile");
const { getIssuerApprovalStatus } = require("../usecases/issuers/getIssuerApprovalStatus");
const { reapplyForApproval } = require("../usecases/issuers/reapplyForApproval");
const { updateOwnIssuerProfile } = require("../usecases/issuers/updateOwnIssuerProfile");
const { updateIssuerPhoto } = require("../usecases/issuers/updateIssuerPhoto");
const { getPublicIssuerProfile } = require("../usecases/issuers/getPublicIssuerProfile");
const { updatePublicIssuerProfile } = require("../usecases/issuers/updatePublicIssuerProfile");
const { deleteOwnIssuerAccount } = require("../usecases/issuers/deleteOwnIssuerAccount");
const { listIssuers } = require("../usecases/issuers/listIssuers");
const { incrementIssuerCertificatesIssued } = require("../usecases/issuers/incrementIssuerCertificatesIssued");
const { getIssuerBusySlots } = require("../usecases/issuers/getIssuerBusySlots");
const { getIssuerCertificatesCount } = require("../usecases/issuers/getIssuerCertificatesCount");
const { registerIssuerProfileShare } = require("../usecases/issuers/registerIssuerProfileShare");

// 2 re-applies per educator per week prevents approval-queue spam.
const reapplyLimiter = rateLimit({
  windowMs: 7 * 24 * 60 * 60 * 1000,
  max: 2,
  keyGenerator: (req) => String(req.auth.sub),
  message: { error: "Too many re-apply requests. Try again next week." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.auth?.sub,
});

// GET /api/issuers/me — own full profile (authenticated)
router.get("/me", authenticate, async (req, res) => {
  if (req.auth.role !== "issuer") {
    return res.status(403).json({ error: "Only educator accounts can access this endpoint" });
  }

  try {
    const result = await getOwnIssuerProfile({ models: { Issuer, User }, wallet: req.auth.wallet });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("GET /api/issuers/me error:", err);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// GET /api/issuers/me/status — educator approval status
router.get("/me/status", authenticate, async (req, res) => {
  if (req.auth.role !== "issuer") {
    return res.status(403).json({ error: "Only educator accounts can access this endpoint" });
  }

  try {
    const result = await getIssuerApprovalStatus({ models: { User }, userId: req.auth.sub });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("GET /api/issuers/me/status error:", err);
    return res.status(500).json({ error: "Failed to fetch status" });
  }
});

// POST /api/issuers/me/reapply — re-submit for approval after rejection
router.post("/me/reapply", authenticate, reapplyLimiter, async (req, res) => {
  if (req.auth.role !== "issuer") {
    return res.status(403).json({ error: "Only educator accounts can use this endpoint" });
  }

  try {
    const result = await reapplyForApproval({ models: { User }, userId: req.auth.sub });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });

    // Fire-and-forget — admin notification failure must not fail the re-apply response.
    (async () => {
      try {
        const [fullUser, issuer, adminEmails] = await Promise.all([
          User.findByPk(req.auth.sub, { attributes: ["name", "email", "wallet_address"] }),
          Issuer.findOne({ where: { wallet_address: req.auth.wallet?.toLowerCase() }, attributes: ["organization_name"] }),
          getAdminEmails(User),
        ]);
        await emailService.notifyAdminEducatorReapply({
          to: adminEmails,
          name: fullUser?.name || null,
          email: fullUser?.email || null,
          wallet: fullUser?.wallet_address || req.auth.wallet,
          organization: issuer?.organization_name || null,
        });
      } catch (err) {
        console.error("[reapply] notifyAdminEducatorReapply failed:", err && err.message);
      }
    })();

    return res.json(result.data);
  } catch (err) {
    console.error("POST /api/issuers/me/reapply error:", err);
    return res.status(500).json({ error: "Failed to re-apply" });
  }
});


// 60 requests/min per IP — public endpoint, no auth needed.
// Redis-backed store so the limit is shared across instances (memory store
// would give effective_max = max × instance_count behind a load balancer).
const featuredLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many requests, slow down" },
  standardHeaders: true,
  legacyHeaders: false,
  store: buildRateLimitStore("/api/issuers/featured"),
});

// GET /api/issuers/featured — random approved educators for discovery widget
// Must be registered before /:wallet_address to avoid param capture.
// Query: count (1–6, default 3)
router.get("/featured", featuredLimiter, async (req, res) => {
  try {
    const raw = parseInt(req.query.count);
    const count = Number.isNaN(raw) ? 3 : Math.min(6, Math.max(1, raw));

    const educators = await getFeaturedIssuers(count);
    return res.json({ educators });
  } catch (err) {
    console.error("GET /api/issuers/featured error:", err);
    return res.status(500).json({ error: "Failed to fetch featured educators" });
  }
});

// GET /api/issuers  — public, paginated educator discovery
// Query params: page (default 1), limit (default 20, max 50), area (filter by knowledge_areas)
router.get("/", async (req, res) => {
  try {
    const result = await listIssuers({
      models: { Issuer, User, Sequelize },
      page: req.query.page,
      limit: req.query.limit,
      area: req.query.area,
    });
    return res.json(result.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch issuers" });
  }
});

// PATCH /api/issuers/me — update own profile (bio, knowledge_areas, organization_name)
router.patch("/me", authenticate, async (req, res) => {
  if (req.auth.role !== "issuer") {
    return res.status(403).json({ error: "Only educator accounts can update this profile" });
  }

  try {
    const result = await updateOwnIssuerProfile({
      models: { Issuer },
      wallet: req.auth.wallet,
      bio: req.body.bio,
      knowledgeAreas: req.body.knowledge_areas,
      organizationName: req.body.organization_name,
    });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("patch issuer error:", err);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

// GET /api/issuers/me/classes — own class settings (authenticated)
router.get("/me/classes", authenticate, async (req, res) => {
  if (req.auth.role !== "issuer") {
    return res.status(403).json({ error: "Only educator accounts can access this endpoint" });
  }

  try {
    const result = await getOwnClassSettings({ models: { Issuer }, wallet: req.auth.wallet });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("GET /api/issuers/me/classes error:", err);
    return res.status(500).json({ error: "Failed to fetch class settings" });
  }
});

// PATCH /api/issuers/me/classes — update class settings (authenticated)
router.patch("/me/classes", authenticate, async (req, res) => {
  if (req.auth.role !== "issuer") {
    return res.status(403).json({ error: "Only educator accounts can update this endpoint" });
  }

  try {
    const result = await updateClassSettings({
      models: { Issuer },
      wallet: req.auth.wallet,
      hourlyRateUsd: req.body.hourly_rate_usd,
      acceptUsdc: req.body.accept_usdc,
      durations: req.body.durations,
      availability: req.body.availability,
      googleCalendarUrl: req.body.google_calendar_url,
    });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("PATCH /api/issuers/me/classes error:", err);
    return res.status(500).json({ error: "Failed to update class settings" });
  }
});

// DELETE /api/issuers/me — hard delete own account
router.delete("/me", authenticate, async (req, res) => {
  if (req.auth.role !== "issuer") {
    return res.status(403).json({ error: "Only educator accounts can be deleted via this endpoint" });
  }

  try {
    const result = await deleteOwnIssuerAccount({
      wallet: req.auth.wallet.toLowerCase(),
      signature: req.body.signature,
      message: req.body.message,
      validateDeletionMessage,
      deleteIssuerAccount,
    });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.status(204).send();
  } catch (err) {
    console.error("delete issuer error:", err);
    return res.status(500).json({ error: "Failed to delete account" });
  }
});

// POST /api/issuers/authorize — admin only (ADMIN_WALLETS / ADMIN_WALLET env)
router.post("/authorize", authenticate, requireAdmin, async (req, res) => {
  try {
    const { issuer } = req.body;
    if (!issuer) return res.status(400).json({ error: "Issuer address required" });

    const txHash = await authorizeIssuer(issuer);
    res.json({ success: true, txHash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Authorization failed" });
  }
});

// PATCH /api/issuers/me/photo  — update own profile photo (ipfs:// URI only)
router.patch("/me/photo", authenticate, async (req, res) => {
  try {
    const result = await updateIssuerPhoto({
      models: { Issuer },
      wallet: req.auth.wallet,
      photoUrl: req.body.photo_url,
    });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("Failed to update issuer photo:", err);
    res.status(500).json({ error: "Failed to update photo" });
  }
});

// GET /api/issuers/:wallet_address  — public profile (no email exposed)
router.get("/:wallet_address", async (req, res) => {
  try {
    const result = await getPublicIssuerProfile({
      models: { Issuer, User, Certificate },
      walletAddress: req.params.wallet_address,
    });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch issuer" });
  }
});

// PUT /api/issuers/:wallet_address  — only the issuer themselves can update their own profile
router.put("/:wallet_address", authenticate, async (req, res) => {
  try {
    const result = await updatePublicIssuerProfile({
      models: { Issuer },
      walletAddress: req.params.wallet_address,
      requesterWallet: req.auth.wallet,
      organizationName: req.body.organization_name,
      bio: req.body.bio,
      knowledgeAreas: req.body.knowledge_areas,
    });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update issuer" });
  }
});

// POST /api/issuers/increment-certificates
router.post("/increment-certificates", authenticate, async (req, res) => {
  try {
    const result = await incrementIssuerCertificatesIssued({
      models: { Issuer },
      requesterWallet: req.auth.wallet,
      issuerWallet: req.body.issuerWallet,
    });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (error) {
    console.error("Increment error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/issuers/:wallet/busy-slots — public, returns occupied time slots for booking UI
// Only exposes date + time + duration, never student data.
router.get("/:wallet/busy-slots", async (req, res) => {
  try {
    const result = await getIssuerBusySlots({ models: { ClassRequest }, walletAddress: req.params.wallet });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("GET /api/issuers/:wallet/busy-slots error:", err);
    return res.status(500).json({ error: "Failed to fetch busy slots" });
  }
});

// GET /api/issuers/:wallet/certificates-count
router.get("/:wallet/certificates-count", async (req, res) => {
  try {
    const result = await getIssuerCertificatesCount({ models: { Issuer }, walletAddress: req.params.wallet });
    return res.json(result.data);
  } catch (e) {
    console.error("Error fetching certificates:", e);
    res.status(500).json({ total: 0 });
  }
});

// 60 requests/min per IP — public endpoint, mirrors featuredLimiter.
// Redis-backed store so the limit is shared across instances.
const shareLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many requests, slow down" },
  standardHeaders: true,
  legacyHeaders: false,
  store: buildRateLimitStore("/api/issuers/share"),
});

// POST /api/issuers/:wallet/share — public, increments the profile share counter.
// No auth: anyone sharing a public profile bumps the count. No per-user tracking (MVP).
router.post("/:wallet/share", shareLimiter, async (req, res) => {
  try {
    const result = await registerIssuerProfileShare({ models: { Issuer }, walletAddress: req.params.wallet });
    if (!result.ok) return res.status(result.httpStatus).json({ error: result.message });
    return res.json(result.data);
  } catch (err) {
    console.error("POST /api/issuers/:wallet/share error:", err);
    return res.status(500).json({ error: "Failed to register share" });
  }
});

module.exports = router;
