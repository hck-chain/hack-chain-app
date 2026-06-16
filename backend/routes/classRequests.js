const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { ClassRequest, Issuer, IssuerClass, User } = require("../models");
const { authenticate } = require("../middleware/auth");

const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests" },
});

const VALID_DURATIONS = [30, 45, 60, 90, 120];
const TIME_RE = /^\d{2}:\d{2}$/;

// POST /api/class-requests — student sends a class request
router.post("/", authenticate, createLimiter, async (req, res) => {
  try {
    if (req.auth.role !== "student") {
      return res.status(403).json({ error: "Only students can request classes" });
    }

    const {
      issuer_wallet_address,
      requested_date,
      start_time,
      duration_minutes,
      hourly_rate_usd,
      student_message,
      issuer_class_id,
    } = req.body;

    if (!issuer_wallet_address || !requested_date || !start_time || !duration_minutes) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!VALID_DURATIONS.includes(Number(duration_minutes))) {
      return res.status(400).json({ error: "Invalid duration" });
    }

    if (!TIME_RE.test(start_time)) {
      return res.status(400).json({ error: "Invalid time format" });
    }

    const date = new Date(requested_date);
    if (isNaN(date.getTime()) || date < new Date()) {
      return res.status(400).json({ error: "Invalid or past date" });
    }

    const issuer = await Issuer.findOne({
      where: { wallet_address: issuer_wallet_address.toLowerCase() },
    });
    if (!issuer || !issuer.class_settings) {
      return res.status(404).json({ error: "Educator not found or does not offer classes" });
    }

    const sanitizedMessage = student_message
      ? String(student_message).trim().slice(0, 500)
      : null;

    // Resolve class name snapshot (if a class was selected)
    let resolvedClassName = null;
    let resolvedClassId = null;
    if (issuer_class_id != null) {
      const issuerClass = await IssuerClass.findOne({
        where: {
          id: Number(issuer_class_id),
          issuer_wallet_address: issuer_wallet_address.toLowerCase(),
          is_active: true,
        },
      });
      if (!issuerClass) {
        return res.status(400).json({ error: "Selected class not found or is no longer available" });
      }
      resolvedClassId = issuerClass.id;
      resolvedClassName = issuerClass.name;
    }

    const request = await ClassRequest.create({
      student_wallet_address: req.auth.wallet.toLowerCase(),
      issuer_wallet_address: issuer_wallet_address.toLowerCase(),
      requested_date,
      start_time,
      duration_minutes: Number(duration_minutes),
      hourly_rate_usd: hourly_rate_usd != null ? Number(hourly_rate_usd) : null,
      student_message: sanitizedMessage,
      issuer_class_id: resolvedClassId,
      class_name: resolvedClassName,
      status: "pending",
    });

    res.status(201).json({ id: request.id, status: request.status });
  } catch (err) {
    console.error("POST /class-requests error:", err);
    res.status(500).json({ error: "Failed to create class request" });
  }
});

// GET /api/class-requests/mine — educator sees incoming requests
router.get("/mine", authenticate, async (req, res) => {
  try {
    if (req.auth.role !== "issuer") {
      return res.status(403).json({ error: "Only educators can view their class requests" });
    }

    const requests = await ClassRequest.findAll({
      where: { issuer_wallet_address: req.auth.wallet.toLowerCase() },
      include: [
        {
          model: User,
          as: "student",
          attributes: ["name", "lastname", "wallet_address"],
        },
      ],
      order: [
        ["requested_date", "ASC"],
        ["start_time", "ASC"],
      ],
    });

    res.json({
      requests: requests.map((r) => ({
        id: r.id,
        student_name: [r.student?.name, r.student?.lastname].filter(Boolean).join(" ") || null,
        student_wallet: r.student_wallet_address,
        requested_date: r.requested_date,
        start_time: r.start_time,
        duration_minutes: r.duration_minutes,
        hourly_rate_usd: r.hourly_rate_usd,
        student_message: r.student_message,
        status: r.status,
        created_at: r.created_at,
      })),
    });
  } catch (err) {
    console.error("GET /class-requests/mine error:", err);
    res.status(500).json({ error: "Failed to fetch class requests" });
  }
});

// PATCH /api/class-requests/:id/status — educator confirms or cancels
router.patch("/:id/status", authenticate, async (req, res) => {
  try {
    if (req.auth.role !== "issuer") {
      return res.status(403).json({ error: "Only educators can update class request status" });
    }

    const { status } = req.body;
    if (!["confirmed", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const request = await ClassRequest.findOne({
      where: {
        id: req.params.id,
        issuer_wallet_address: req.auth.wallet.toLowerCase(),
      },
    });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    await request.update({ status });
    res.json({ id: request.id, status: request.status });
  } catch (err) {
    console.error("PATCH /class-requests/:id/status error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

module.exports = router;
