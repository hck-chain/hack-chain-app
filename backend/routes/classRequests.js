const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const db = require("../models");
const { authenticate } = require("../middleware/auth");
const { requestClass } = require("../usecases/classes/requestClass");
const { updateClassRequestStatus } = require("../usecases/classes/updateClassRequestStatus");
const { cancelClassRequest } = require("../usecases/classes/cancelClassRequest");
const { notifyEducatorClassRequest, notifyTalentClassRequestUpdate, notifyEducatorClassConfirmed, notifyEducatorClassCancelled } = require("../services/emailService");

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
      if (!educatorUser) {
        console.warn(`[email] class-request: educator user not found for wallet ${req.body.issuer_wallet_address}`);
        return;
      }
      if (!educatorUser.email) {
        console.warn(`[email] class-request: educator has no email — skipping notification`);
        return;
      }
      const studentName = [studentUser?.name, studentUser?.lastname].filter(Boolean).join(" ") || req.auth.wallet.slice(0, 8);
      console.log(`[email] class-request: sending notification to ${educatorUser.email}`);
      return notifyEducatorClassRequest({
        to: educatorUser.email,
        educatorName: educatorUser.name || null,
        studentName,
        requestedDate: req.body.requested_date,
        startTime: req.body.start_time,
        durationMinutes: req.body.duration_minutes,
        className: result.data.class_name || null,
      });
    }).catch((err) => console.error("[email] class-request: error sending notification:", err));

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
        attributes: ["wallet_address", "organization_name", "photo_url"],
      }],
      order: [["requested_date", "DESC"], ["start_time", "DESC"]],
    });

    return res.json({
      requests: requests.map((r) => ({
        id: r.id,
        issuer_organization: r.issuer?.organization_name || null,
        issuer_photo: r.issuer?.photo_url || null,
        issuer_wallet: r.issuer_wallet_address,
        requested_date: r.requested_date,
        start_time: r.start_time,
        duration_minutes: r.duration_minutes,
        hourly_rate_usd: r.hourly_rate_usd,
        class_name: r.class_name || null,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at,
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
    const cancellationReason = req.body.status === "cancelled" && req.body.cancellation_reason
      ? String(req.body.cancellation_reason).trim().slice(0, 500) || undefined
      : undefined;

    const result = await updateClassRequestStatus({
      models: db,
      requestId: req.params.id,
      issuerWallet: req.auth.wallet,
      status: req.body.status,
      cancellationReason,
    });

    if (!result.ok) return res.status(result.httpStatus).json({ error: result.code });

    // Fire-and-forget — email failure must not fail the status update response.
    if (["confirmed", "cancelled", "completed"].includes(req.body.status)) {
      const statusSnapshot = req.body.status;
      db.ClassRequest.findByPk(req.params.id, {
        attributes: ["id", "student_wallet_address", "issuer_wallet_address", "class_name", "requested_date", "start_time", "duration_minutes"],
      }).then((record) => {
        if (!record) return;
        return Promise.all([
          db.User.findOne({ where: { wallet_address: record.student_wallet_address.toLowerCase() }, attributes: ["email", "name", "lastname"] }),
          db.User.findOne({ where: { wallet_address: record.issuer_wallet_address.toLowerCase() }, attributes: ["email", "name"] }),
        ]).then(([studentUser, educatorUser]) => {
          const studentName = [studentUser?.name, studentUser?.lastname].filter(Boolean).join(" ") || null;
          const educatorName = educatorUser?.name || null;
          const sharedFields = {
            className: record.class_name || null,
            requestedDate: record.requested_date,
            startTime: record.start_time,
            durationMinutes: record.duration_minutes,
            requestId: record.id,
          };
          const promises = [];

          // Notify talent of any status change
          if (studentUser?.email) {
            console.log(`[email] class-request-update: status=${statusSnapshot} → ${studentUser.email}`);
            promises.push(notifyTalentClassRequestUpdate({
              to: studentUser.email,
              studentName,
              educatorName,
              status: statusSnapshot,
              cancellationReason: statusSnapshot === "cancelled" ? cancellationReason : undefined,
              ...sharedFields,
            }));
          } else {
            console.warn(`[email] class-request-update: student has no email — id=${req.params.id}`);
          }

          // Send calendar invite to educator when they confirm a class
          if (statusSnapshot === "confirmed" && educatorUser?.email) {
            console.log(`[email] class-request-update: calendar invite → educator ${educatorUser.email}`);
            promises.push(notifyEducatorClassConfirmed({
              to: educatorUser.email,
              educatorName,
              studentName,
              ...sharedFields,
            }));
          }

          return Promise.all(promises);
        });
      }).catch((err) => console.error("[email] class-request-update: error:", err));
    }

    return res.json(result.data);
  } catch (err) {
    console.error("PATCH /class-requests/:id/status error:", err);
    return res.status(500).json({ error: "Failed to update status" });
  }
});

// PATCH /api/class-requests/:id/cancel — student withdraws their own pending request
router.patch("/:id/cancel", authenticate, async (req, res) => {
  if (req.auth.role !== "student") {
    return res.status(403).json({ error: "Only students can cancel their own requests" });
  }

  try {
    const cancellationReason = req.body?.cancellation_reason
      ? String(req.body.cancellation_reason).trim().slice(0, 500) || undefined
      : undefined;

    const result = await cancelClassRequest({
      models: db,
      requestId: req.params.id,
      studentWallet: req.auth.wallet,
      cancellationReason,
    });

    if (!result.ok) return res.status(result.httpStatus).json({ error: result.code });

    // Fire-and-forget — email failure must not fail the cancellation response.
    Promise.all([
      db.User.findOne({ where: { wallet_address: result.data.issuer_wallet_address?.toLowerCase() }, attributes: ["email", "name"] }),
      db.User.findOne({ where: { wallet_address: req.auth.wallet.toLowerCase() }, attributes: ["name", "lastname"] }),
    ]).then(([educatorUser, studentUser]) => {
      if (!educatorUser?.email) {
        console.warn(`[email] class-cancel: educator has no email — id=${req.params.id}`);
        return;
      }
      const studentName = [studentUser?.name, studentUser?.lastname].filter(Boolean).join(" ") || req.auth.wallet.slice(0, 8);
      console.log(`[email] class-cancel: notifying educator ${educatorUser.email}`);
      return notifyEducatorClassCancelled({
        to: educatorUser.email,
        educatorName: educatorUser.name || null,
        studentName,
        className: result.data.class_name || null,
        requestedDate: result.data.requested_date,
        startTime: result.data.start_time,
        durationMinutes: result.data.duration_minutes,
        cancellationReason: cancellationReason || null,
      });
    }).catch((err) => console.error("[email] class-cancel: error:", err));

    return res.json({ id: result.data.id, status: result.data.status });
  } catch (err) {
    console.error("PATCH /class-requests/:id/cancel error:", err);
    return res.status(500).json({ error: "Failed to cancel request" });
  }
});

module.exports = router;
