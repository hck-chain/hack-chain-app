// backend/routes/issuers.js
const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { Issuer, Student, User, Certificate } = require("../models");
const { authorizeIssuer } = require("../services/authorizeIssuer.js");
const { validateDeletionMessage, deleteIssuerAccount } = require("../services/issuerService");
const { getFeaturedIssuers } = require("../services/issuerDiscoveryService");
const { authenticate } = require("../middleware/auth");
const emailService = require("../services/emailService");
const { getAdminEmails } = require("../services/adminService");

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
  try {
    if (req.auth.role !== "issuer") {
      return res.status(403).json({ error: "Only educator accounts can access this endpoint" });
    }

    const wallet = req.auth.wallet.toLowerCase();
    const issuer = await Issuer.findOne({
      where: { wallet_address: wallet },
      include: [{ model: User, attributes: ["name", "lastname", "email", "email_verified"] }],
    });

    if (!issuer) return res.status(404).json({ error: "Issuer not found" });

    return res.json({
      organization_name: issuer.organization_name,
      bio: issuer.bio,
      photo_url: issuer.photo_url,
      knowledge_areas: issuer.knowledge_areas ?? [],
      wallet_address: issuer.wallet_address,
      email: issuer.User?.email ?? null,
      name: issuer.User?.name ?? null,
      lastname: issuer.User?.lastname ?? null,
      email_verified: issuer.User?.email_verified ?? false,
    });
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
    const user = await User.findByPk(req.auth.sub, {
      attributes: ["educator_approval_status", "rejection_reason", "approved_at"],
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const status = user.educator_approval_status || "pending_approval";
    const body = { status };
    if (status === "rejected" && user.rejection_reason) {
      body.reason = user.rejection_reason;
    }
    if (status === "approved" && user.approved_at) {
      body.approved_at = user.approved_at;
    }
    return res.json(body);
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
    const user = await User.findByPk(req.auth.sub, {
      attributes: ["id", "educator_approval_status"],
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.educator_approval_status !== "rejected") {
      return res.status(409).json({ error: "Only rejected accounts can re-apply" });
    }

    await user.update({
      educator_approval_status: "pending_approval",
      rejection_reason: null,
    });

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

    return res.json({ status: "pending_approval" });
  } catch (err) {
    console.error("POST /api/issuers/me/reapply error:", err);
    return res.status(500).json({ error: "Failed to re-apply" });
  }
});


// 60 requests/min per IP — public endpoint, no auth needed
const featuredLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many requests, slow down" },
  standardHeaders: true,
  legacyHeaders: false,
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
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const area  = typeof req.query.area === "string" ? req.query.area.trim() : null;

    const { Op } = require("sequelize");

    const userWhere = { educator_approval_status: "approved" };
    const issuerWhere = {};
    if (area) {
      issuerWhere.knowledge_areas = { [Op.contains]: [area] };
    }

    const { count, rows } = await Issuer.findAndCountAll({
      where: issuerWhere,
      include: [{
        model: User,
        attributes: ["name", "lastname", "created_at"],
        where: userWhere,
        required: true,
      }],
      order: [["certificates_issued", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });

    res.json({
      educators: rows.map((issuer) => ({
        wallet_address:      issuer.wallet_address,
        organization_name:   issuer.organization_name,
        name:                issuer.User?.name     || null,
        lastname:            issuer.User?.lastname  || null,
        photo_url:           issuer.photo_url       || null,
        bio:                 issuer.bio             || null,
        knowledge_areas:     issuer.knowledge_areas || [],
        certificates_issued: issuer.certificates_issued,
        has_classes:         issuer.class_settings !== null && issuer.class_settings !== undefined,
        joined_at:           issuer.User?.created_at || issuer.created_at,
      })),
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch issuers" });
  }
});

// PATCH /api/issuers/me — update own profile (bio, knowledge_areas, organization_name)
router.patch("/me", authenticate, async (req, res) => {
  try {
    if (req.auth.role !== "issuer") {
      return res.status(403).json({ error: "Only educator accounts can update this profile" });
    }

    const wallet = req.auth.wallet.toLowerCase();
    const { bio, knowledge_areas, organization_name } = req.body;

    if (bio !== undefined && typeof bio !== "string") {
      return res.status(400).json({ error: "bio must be a string" });
    }
    if (bio !== undefined && bio.length > 500) {
      return res.status(400).json({ error: "bio must be 500 characters or less" });
    }
    if (knowledge_areas !== undefined) {
      if (!Array.isArray(knowledge_areas)) {
        return res.status(400).json({ error: "knowledge_areas must be an array" });
      }
      if (knowledge_areas.length > 5) {
        return res.status(400).json({ error: "Maximum 5 knowledge areas allowed" });
      }
      if (knowledge_areas.some((a) => typeof a !== "string" || a.length > 100)) {
        return res.status(400).json({ error: "Each knowledge area must be a string of max 100 characters" });
      }
    }
    if (organization_name !== undefined && (typeof organization_name !== "string" || organization_name.trim().length === 0)) {
      return res.status(400).json({ error: "organization_name must be a non-empty string" });
    }

    const issuer = await Issuer.findOne({ where: { wallet_address: wallet } });
    if (!issuer) return res.status(404).json({ error: "Issuer not found" });

    const updates = {};
    if (bio !== undefined) updates.bio = bio.trim();
    if (knowledge_areas !== undefined) updates.knowledge_areas = knowledge_areas;
    if (organization_name !== undefined) updates.organization_name = organization_name.trim();

    await issuer.update(updates);

    return res.json({
      message: "Profile updated",
      issuer: {
        organization_name: issuer.organization_name,
        bio: issuer.bio,
        knowledge_areas: issuer.knowledge_areas,
        photo_url: issuer.photo_url,
      },
    });
  } catch (err) {
    console.error("patch issuer error:", err);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

// GET /api/issuers/me/classes — own class settings (authenticated)
router.get("/me/classes", authenticate, async (req, res) => {
  try {
    if (req.auth.role !== "issuer") {
      return res.status(403).json({ error: "Only educator accounts can access this endpoint" });
    }
    const wallet = req.auth.wallet.toLowerCase();
    const issuer = await Issuer.findOne({ where: { wallet_address: wallet }, attributes: ["class_settings"] });
    if (!issuer) return res.status(404).json({ error: "Issuer not found" });
    return res.json({ class_settings: issuer.class_settings ?? null });
  } catch (err) {
    console.error("GET /api/issuers/me/classes error:", err);
    return res.status(500).json({ error: "Failed to fetch class settings" });
  }
});

const VALID_DURATIONS = [30, 45, 60];
const VALID_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// PATCH /api/issuers/me/classes — update class settings (authenticated)
router.patch("/me/classes", authenticate, async (req, res) => {
  try {
    if (req.auth.role !== "issuer") {
      return res.status(403).json({ error: "Only educator accounts can update this endpoint" });
    }

    const { hourly_rate_usd, accept_usdc, durations, availability, google_calendar_url } = req.body;

    if (hourly_rate_usd !== undefined && hourly_rate_usd !== null) {
      if (typeof hourly_rate_usd !== "number" || hourly_rate_usd < 0 || hourly_rate_usd > 9999) {
        return res.status(400).json({ error: "hourly_rate_usd must be a number between 0 and 9999" });
      }
    }

    if (accept_usdc !== undefined && typeof accept_usdc !== "boolean") {
      return res.status(400).json({ error: "accept_usdc must be a boolean" });
    }

    if (durations !== undefined) {
      if (
        !Array.isArray(durations) ||
        durations.length === 0 ||
        durations.length > VALID_DURATIONS.length ||
        durations.some((d) => !VALID_DURATIONS.includes(d)) ||
        new Set(durations).size !== durations.length
      ) {
        return res.status(400).json({ error: "durations must be a non-empty array of unique values from [30, 45, 60]" });
      }
    }

    if (availability !== undefined) {
      if (typeof availability !== "object" || availability === null || Array.isArray(availability)) {
        return res.status(400).json({ error: "availability must be an object" });
      }
      // Whitelist-only: reject any key that is not a valid day to prevent JSONB injection
      const incomingKeys = Object.keys(Object.assign({}, availability));
      const extraKeys = incomingKeys.filter((k) => !VALID_DAYS.includes(k));
      if (extraKeys.length > 0) {
        return res.status(400).json({ error: `availability contains invalid keys: ${extraKeys.join(", ")}` });
      }
      for (const day of VALID_DAYS) {
        const slot = Object.prototype.hasOwnProperty.call(availability, day) ? availability[day] : undefined;
        if (slot === undefined || slot === null) continue;
        if (typeof slot !== "object" || Array.isArray(slot)) {
          return res.status(400).json({ error: `availability.${day} must be an object` });
        }
        if (typeof slot.enabled !== "boolean") {
          return res.status(400).json({ error: `availability.${day}.enabled must be a boolean` });
        }
        if (slot.enabled) {
          if (!TIME_RE.test(slot.start) || !TIME_RE.test(slot.end)) {
            return res.status(400).json({ error: `availability.${day} must have valid HH:MM start and end times` });
          }
          if (slot.start >= slot.end) {
            return res.status(400).json({ error: `availability.${day}.start must be before end` });
          }
        }
      }
    }

    if (google_calendar_url !== undefined && google_calendar_url !== null) {
      if (typeof google_calendar_url !== "string" || google_calendar_url.length > 1000) {
        return res.status(400).json({ error: "google_calendar_url must be a string of max 1000 characters" });
      }
      if (google_calendar_url.trim().length > 0 && !google_calendar_url.trim().startsWith("https://calendar.google.com/")) {
        return res.status(400).json({ error: "google_calendar_url must be a valid Google Calendar embed URL" });
      }
    }

    const wallet = req.auth.wallet.toLowerCase();
    const issuer = await Issuer.findOne({ where: { wallet_address: wallet } });
    if (!issuer) return res.status(404).json({ error: "Issuer not found" });

    const current = issuer.class_settings ?? {};
    const updated = {
      ...current,
      ...(hourly_rate_usd !== undefined && { hourly_rate_usd: hourly_rate_usd ?? null }),
      ...(accept_usdc !== undefined && { accept_usdc }),
      ...(durations !== undefined && { durations }),
      ...(availability !== undefined && { availability }),
      ...(google_calendar_url !== undefined && { google_calendar_url: google_calendar_url?.trim() || null }),
    };

    await issuer.update({ class_settings: updated });
    return res.json({ class_settings: issuer.class_settings });
  } catch (err) {
    console.error("PATCH /api/issuers/me/classes error:", err);
    return res.status(500).json({ error: "Failed to update class settings" });
  }
});

// DELETE /api/issuers/me — hard delete own account
router.delete("/me", authenticate, async (req, res) => {
  try {
    if (req.auth.role !== "issuer") {
      return res.status(403).json({ error: "Only educator accounts can be deleted via this endpoint" });
    }

    const { signature, message } = req.body;
    if (!signature || !message) {
      return res.status(400).json({ error: "signature and message are required" });
    }

    const wallet = req.auth.wallet.toLowerCase();
    const validation = validateDeletionMessage(message, signature, wallet);
    if (!validation.ok) {
      return res.status(401).json({ error: validation.error });
    }

    await deleteIssuerAccount(wallet);

    return res.status(204).send();
  } catch (err) {
    console.error("delete issuer error:", err);
    return res.status(500).json({ error: "Failed to delete account" });
  }
});

// POST /api/issuers/authorize — admin only (ADMIN_WALLET env var)
router.post("/authorize", authenticate, async (req, res) => {
  try {
    const callerWallet = req.auth.wallet.toLowerCase();
    const adminWallet = (process.env.ADMIN_WALLET || "").toLowerCase();
    if (!adminWallet || callerWallet !== adminWallet) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { issuer } = req.body;
    if (!issuer) return res.status(400).json({ error: "Issuer address required" });

    const txHash = await authorizeIssuer(issuer);
    res.json({ success: true, txHash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Authorization failed" });
  }
});
//|| !certificate_hash || !token_id)
// POST /api/issuers/mint
router.post("/mint", authenticate, async (req, res) => {
  try {
    const {
      studentWalletAddress,
      professor,
      tokenUri
    } = req.body;

    if (!studentWalletAddress || !professor || !tokenUri) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (req.auth.wallet.toLowerCase() !== professor.toLowerCase()) {
      return res.status(403).json({ error: "Cannot mint from another issuer's account" });
    }

    const student = await Student.findOne({
      where: { wallet_address: studentWalletAddress.toLowerCase() }
    });

    const issuer = await Issuer.findOne({
      where: { wallet_address: professor.toLowerCase() }
    });

    if (!student) return res.status(404).json({ error: "Student not found" });
    if (!issuer) return res.status(404).json({ error: "Issuer not found" });

    return res.json({
      ok: true,
      tokenUri
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Mint validation failed" });
  }
});

// PATCH /api/issuers/me/photo  — update own profile photo (ipfs:// URI only)
router.patch("/me/photo", authenticate, async (req, res) => {
  try {
    const wallet = req.auth.wallet.toLowerCase();
    const { photo_url } = req.body;

    if (!photo_url || typeof photo_url !== "string") {
      return res.status(400).json({ error: "photo_url is required" });
    }

    if (!/^ipfs:\/\/[a-zA-Z0-9]+$/.test(photo_url)) {
      return res.status(400).json({ error: "photo_url must be a valid ipfs:// URI" });
    }

    const issuer = await Issuer.findOne({ where: { wallet_address: wallet } });
    if (!issuer) return res.status(404).json({ error: "Issuer not found" });

    await issuer.update({ photo_url });

    res.json({ photo_url: issuer.photo_url });

  } catch (err) {
    console.error("Failed to update issuer photo:", err);
    res.status(500).json({ error: "Failed to update photo" });
  }
});

// GET /api/issuers/:wallet_address  — public profile (no email exposed)
router.get("/:wallet_address", async (req, res) => {
  try {
    const wallet_address = req.params.wallet_address.toLowerCase();

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const { Op } = require("sequelize");
    const issuer = await Issuer.findOne({
      where: { wallet_address },
      include: [
        {
          model: User,
          attributes: ["name", "lastname", "created_at", "educator_approval_status"],
        },
        {
          model: Certificate,
          attributes: ["student_wallet_address"],
        },
      ],
    });

    if (!issuer) return res.status(404).json({ error: "Issuer not found" });

    const talents_formed = new Set(
      (issuer.Certificates || []).map((c) => c.student_wallet_address)
    ).size;

    res.json({
      issuer: {
        wallet_address: issuer.wallet_address,
        organization_name: issuer.organization_name,
        name: issuer.User?.name || null,
        lastname: issuer.User?.lastname || null,
        photo_url: issuer.photo_url || null,
        bio: issuer.bio || null,
        knowledge_areas: issuer.knowledge_areas || [],
        certificates_issued: issuer.certificates_issued,
        talents_formed,
        joined_at: issuer.User?.created_at || issuer.created_at,
        is_approved: issuer.User?.educator_approval_status === 'approved',
        class_settings: issuer.class_settings ?? null,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch issuer" });
  }
});

// PUT /api/issuers/:wallet_address  — only the issuer themselves can update their own profile
router.put("/:wallet_address", authenticate, async (req, res) => {
  try {
    const wallet_address = req.params.wallet_address.toLowerCase();

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    if (req.auth.wallet.toLowerCase() !== wallet_address) {
      return res.status(403).json({ error: "Forbidden: cannot modify another issuer's profile" });
    }

    const { organization_name, bio, knowledge_areas } = req.body;

    if (
      knowledge_areas !== undefined &&
      (!Array.isArray(knowledge_areas) ||
        knowledge_areas.some((a) => typeof a !== "string" || a.length > 100))
    ) {
      return res.status(400).json({ error: "knowledge_areas must be an array of strings (max 100 chars each)" });
    }

    const issuer = await Issuer.findOne({ where: { wallet_address } });
    if (!issuer) return res.status(404).json({ error: "Issuer not found" });

    const updates = {};
    if (organization_name !== undefined) updates.organization_name = organization_name;
    if (bio !== undefined) updates.bio = bio;
    if (knowledge_areas !== undefined) updates.knowledge_areas = knowledge_areas;

    await issuer.update(updates);

    res.json({ message: "Issuer updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update issuer" });
  }
});

// POST /api/issuers/increment-certificates
router.post("/increment-certificates", authenticate, async (req, res) => {
  try {
    const { issuerWallet } = req.body;
    if (!issuerWallet) return res.status(400).json({ error: "issuerWallet required" });

    if (req.auth.wallet.toLowerCase() !== issuerWallet.toLowerCase()) {
      return res.status(403).json({ error: "Cannot increment certificates for another issuer" });
    }

    await Issuer.increment(
      { certificates_issued: 1 },
      { where: { wallet_address: issuerWallet.toLowerCase() } }
    );

    res.json({ success: true });

  } catch (error) {
    console.error("Increment error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/issuers/:wallet/certificates-count
router.get("/:wallet/certificates-count", async (req, res) => {
  try {
    const { wallet } = req.params;

    const issuer = await Issuer.findOne({
      where: { wallet_address: wallet.toLowerCase() },
      attributes: ["certificates_issued"],
    });

    res.json({
      total: issuer?.certificates_issued || 0,
    });

  } catch (e) {
    console.error("Error fetching certificates:", e);
    res.status(500).json({ total: 0 });
  }
});

module.exports = router;
