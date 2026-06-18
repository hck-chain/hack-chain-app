const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const db = require("../models");
const { authenticate } = require("../middleware/auth");
const { requestClass } = require("../usecases/classes/requestClass");
const { updateClassRequestStatus } = require("../usecases/classes/updateClassRequestStatus");
const { notifyEducatorClassRequest } = require("../services/emailService");

const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests" },
});

// POST /api/class-requests
router.post("/", authenticate, createLimiter, async (req, res) => {
  if (req.auth.role !== "student") {
    return res.status(403).json({ error: "Only students can request classes" });
  }

  try {
    const result = await requestClass({
      models: db,
      studentWallet: req.auth.wallet,
      issuerWalletAddress: req.body.issuer_wallet_address,
      requestedDate: req.body.requested_date,
      startTime: req.body.start_time,
      durationMinutes: req.body.duration_minutes,
      hourlyRateUsd: req.body.hourly_rate_usd,
      studentMessage: req.body.student_message,
      issuerClassId: req.body.issuer_class_id,
      requestedTimestampUtc: req.body.requested_timestamp_utc,
    });

    if (!result.ok) return res.status(result.httpStatus).json({ error: result.code });

    // Fire-and-forget — email failure must not fail the booking response.
    Promise.all([
      db.User.findOne({ where: { wallet_address: req.body.issuer_wallet_address?.toLowerCase() }, attributes: ["email", "name"] }),
      db.User.findOne({ where: { wallet_address: req.auth.wallet.toLowerCase() }, attributes: ["name", "lastname"] }),
    ]).then(([educatorUser, studentUser]) => {
      if (!educatorUser?.email) return;
      const studentName = [studentUser?.name, studentUser?.lastname].filter(Boolean).join(" ") || req.auth.wallet.slice(0, 8);
      return notifyEducatorClassRequest({
        to: educatorUser.email,
        educatorName: educatorUser.name || null,
        studentName,
        requestedDate: req.body.requested_date,
        startTime: req.body.start_time,
        durationMinutes: req.body.duration_minutes,
        className: result.data.class_name || null,
      });
    }).catch((err) => console.error("[email] Error notificando solicitud de clase:", err));

    return res.status(201).json(result.data);
  } catch (err) {
    console.error("POST /class-requests error:", err);
    return res.status(500).json({ error: "Failed to create class request" });
  }
});

// GET /api/class-requests/pending-count — lightweight poll for notification badge
router.get("/pending-count", authenticate, async (req, res) => {
  if (req.auth.role !== "issuer") {
    return res.status(403).json({ error: "Only educators can access this endpoint" });
  }
  try {
    const { Op } = require("sequelize");
    const count = await db.ClassRequest.count({
      where: {
        issuer_wallet_address: req.auth.wallet.toLowerCase(),
        status: "pending",
      },
    });
    return res.json({ count });
  } catch (err) {
    console.error("GET /class-requests/pending-count error:", err);
    return res.status(500).json({ error: "Failed to fetch count" });
  }
});

// GET /api/class-requests/mine
router.get("/mine", authenticate, async (req, res) => {
  if (req.auth.role !== "issuer") {
    return res.status(403).json({ error: "Only educators can view their class requests" });
  }

  try {
    const requests = await db.ClassRequest.findAll({
      where: { issuer_wallet_address: req.auth.wallet.toLowerCase() },
      include: [{ model: db.User, as: "student", attributes: ["name", "lastname", "wallet_address"] }],
      order: [["requested_date", "ASC"], ["start_time", "ASC"]],
    });

    return res.json({
      requests: requests.map((r) => ({
        id: r.id,
        student_name: [r.student?.name, r.student?.lastname].filter(Boolean).join(" ") || null,
        student_wallet: r.student_wallet_address,
        requested_date: r.requested_date,
        start_time: r.start_time,
        duration_minutes: r.duration_minutes,
        hourly_rate_usd: r.hourly_rate_usd,
        student_message: r.student_message,
        class_name: r.class_name || null,
        status: r.status,
        created_at: r.created_at,
      })),
    });
  } catch (err) {
    console.error("GET /class-requests/mine error:", err);
    return res.status(500).json({ error: "Failed to fetch class requests" });
  }
});

// GET /api/class-requests/sent
router.get("/sent", authenticate, async (req, res) => {
  if (req.auth.role !== "student") {
    return res.status(403).json({ error: "Only students can view their sent class requests" });
  }

  try {
    const requests = await db.ClassRequest.findAll({
      where: { student_wallet_address: req.auth.wallet.toLowerCase() },
      include: [{
        model: db.Issuer,
        as: "issuer",
        attributes: ["wallet_address", "organization_name"],
      }],
      order: [["requested_date", "DESC"], ["start_time", "DESC"]],
    });

    return res.json({
      requests: requests.map((r) => ({
        id: r.id,
        issuer_organization: r.issuer?.organization_name || null,
        issuer_wallet: r.issuer_wallet_address,
        requested_date: r.requested_date,
        start_time: r.start_time,
        duration_minutes: r.duration_minutes,
        hourly_rate_usd: r.hourly_rate_usd,
        class_name: r.class_name || null,
        status: r.status,
        created_at: r.created_at,
      })),
    });
  } catch (err) {
    console.error("GET /class-requests/sent error:", err);
    return res.status(500).json({ error: "Failed to fetch sent class requests" });
  }
});

// PATCH /api/class-requests/:id/status
router.patch("/:id/status", authenticate, async (req, res) => {
  if (req.auth.role !== "issuer") {
    return res.status(403).json({ error: "Only educators can update class request status" });
  }

  try {
    const result = await updateClassRequestStatus({
      models: db,
      requestId: req.params.id,
      issuerWallet: req.auth.wallet,
      status: req.body.status,
    });

    if (!result.ok) return res.status(result.httpStatus).json({ error: result.code });
    return res.json(result.data);
  } catch (err) {
    console.error("PATCH /class-requests/:id/status error:", err);
    return res.status(500).json({ error: "Failed to update status" });
  }
});

module.exports = router;
