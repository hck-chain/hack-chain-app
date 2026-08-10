const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const db = require("../models");
const { authenticate } = require("../middleware/auth");
const { requestClass } = require("../usecases/classes/requestClass");
const { updateClassRequestStatus } = require("../usecases/classes/updateClassRequestStatus");
const { cancelClassRequest } = require("../usecases/classes/cancelClassRequest");
const { submitPaymentProof } = require("../usecases/classPayments/submitPaymentProof");
const { confirmPaymentReceived } = require("../usecases/classPayments/confirmPaymentReceived");
const { openPaymentDispute } = require("../usecases/classPayments/openPaymentDispute");
const {
  notifyEducatorClassRequest,
  notifyTalentClassRequestUpdate,
  notifyEducatorClassConfirmed,
  notifyTalentMeetingLinkReady,
  notifyEducatorClassCancelled,
  notifyEducatorPaymentSubmitted,
  notifyEducatorPaymentConfirmedOnChain,
  notifyTalentPaymentConfirmed,
  notifyPaymentDisputeOpened,
} = require("../services/emailService");
const { getAdminEmails } = require("../services/adminService");
const { createPolygonProvider } = require("../harjoot/adapters/polygonProvider");

const VALID_STAGES = ["deposit", "final"];

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
      // hourly_rate_usd is intentionally NOT taken from the client — it's
      // derived server-side in requestClass.js from the educator's own
      // configured rate, since it's later trusted as the payment amount.
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

// GET /api/class-requests/pending-count — lightweight poll for notification badge.
// Counts both brand-new requests waiting on the educator AND payment proofs
// the talent already submitted that are waiting on the educator to confirm.
router.get("/pending-count", authenticate, async (req, res) => {
  if (req.auth.role !== "issuer") {
    return res.status(403).json({ error: "Only educators can access this endpoint" });
  }
  try {
    const { Op } = require("sequelize");
    const count = await db.ClassRequest.count({
      where: {
        issuer_wallet_address: req.auth.wallet.toLowerCase(),
        [Op.or]: [
          { status: "pending" },
          { payment_status: { [Op.in]: ["deposit_submitted", "final_submitted"] } },
        ],
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
      // Queue order, not class-date order — the most recently submitted
      // request sits on top regardless of which day the class itself falls on.
      order: [["created_at", "DESC"]],
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
        payment_status: r.payment_status,
        currency: r.currency,
        amount: r.amount,
        deposit_proof_url: r.deposit_proof_url,
        deposit_proof_cid: r.deposit_proof_cid,
        final_proof_url: r.final_proof_url,
        final_proof_cid: r.final_proof_cid,
        deposit_tx_hash: r.deposit_tx_hash,
        final_tx_hash: r.final_tx_hash,
        meeting_url: r.meeting_url,
        created_at: r.created_at,
        updated_at: r.updated_at,
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
      // Queue order, not class-date order — same fix as GET /mine.
      order: [["created_at", "DESC"]],
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
        payment_status: r.payment_status,
        currency: r.currency,
        amount: r.amount,
        deposit_proof_url: r.deposit_proof_url,
        deposit_proof_cid: r.deposit_proof_cid,
        final_proof_url: r.final_proof_url,
        final_proof_cid: r.final_proof_cid,
        deposit_tx_hash: r.deposit_tx_hash,
        final_tx_hash: r.final_tx_hash,
        meeting_url: r.meeting_url,
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

    const meetingUrl = req.body.status === "confirmed" && req.body.meeting_url
      ? String(req.body.meeting_url).trim().slice(0, 1000)
      : undefined;

    const result = await updateClassRequestStatus({
      models: db,
      requestId: req.params.id,
      issuerWallet: req.auth.wallet,
      status: req.body.status,
      cancellationReason,
      meetingUrl,
    });

    if (!result.ok) return res.status(result.httpStatus).json({ error: result.code });

    // A re-save with status:"confirmed" on an already-confirmed request only
    // happens when the educator is setting/editing the meeting link (see
    // updateClassRequestStatus) — that's not a fresh confirmation and needs a
    // different notification, not the full "confirmed, pay your deposit" flow.
    const isFreshConfirmation = req.body.status === "confirmed" && result.data.previous_status !== "confirmed";
    const isMeetingLinkUpdate = req.body.status === "confirmed" && result.data.previous_status === "confirmed" && result.data.meeting_url_changed;

    // Fire-and-forget — email failure must not fail the status update response.
    if (isFreshConfirmation || isMeetingLinkUpdate || ["cancelled", "completed"].includes(req.body.status)) {
      const statusSnapshot = req.body.status;
      db.ClassRequest.findByPk(req.params.id, {
        attributes: ["id", "student_wallet_address", "issuer_wallet_address", "class_name", "requested_date", "start_time", "duration_minutes", "meeting_url"],
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

          if (isMeetingLinkUpdate) {
            if (studentUser?.email && record.meeting_url) {
              console.log(`[email] class-request-update: meeting link ready → ${studentUser.email}`);
              promises.push(notifyTalentMeetingLinkReady({
                to: studentUser.email,
                studentName,
                educatorName,
                className: record.class_name || null,
                meetingUrl: record.meeting_url,
              }));
            }
            return Promise.all(promises);
          }

          // Fresh status change (confirmed/cancelled/completed) — notify talent
          if (studentUser?.email) {
            console.log(`[email] class-request-update: status=${statusSnapshot} → ${studentUser.email}`);
            promises.push(notifyTalentClassRequestUpdate({
              to: studentUser.email,
              studentName,
              educatorName,
              status: statusSnapshot,
              cancellationReason: statusSnapshot === "cancelled" ? cancellationReason : undefined,
              meetingUrl: isFreshConfirmation ? record.meeting_url : undefined,
              ...sharedFields,
            }));
          } else {
            console.warn(`[email] class-request-update: student has no email — id=${req.params.id}`);
          }

          // Send calendar invite to educator on a fresh confirmation only
          if (isFreshConfirmation && educatorUser?.email) {
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

// POST /api/class-requests/:id/payments/:stage — talent submits proof
router.post("/:id/payments/:stage", authenticate, createLimiter, async (req, res) => {
  if (req.auth.role !== "student") {
    return res.status(403).json({ error: "Only students can submit payment proof" });
  }
  if (!VALID_STAGES.includes(req.params.stage)) {
    return res.status(400).json({ error: "INVALID_STAGE" });
  }

  try {
    const result = await submitPaymentProof({
      models: db,
      requestId: req.params.id,
      studentWallet: req.auth.wallet,
      stage: req.params.stage,
      proofUrl: req.body.proof_url,
      proofCid: req.body.proof_cid,
      txHash: req.body.tx_hash,
      amount: req.body.amount,
      currency: req.body.currency,
      paymentNetwork: req.body.payment_network,
      provider: req.body.tx_hash ? createPolygonProvider() : undefined,
    });

    if (!result.ok) return res.status(result.httpStatus).json({ error: result.code });

    const wasVerifiedOnChain = Boolean(req.body.tx_hash);
    const notifyEducator = wasVerifiedOnChain ? notifyEducatorPaymentConfirmedOnChain : notifyEducatorPaymentSubmitted;

    db.User.findOne({ where: { wallet_address: result.data.issuer_wallet_address?.toLowerCase() }, attributes: ["email", "name"] })
      .then((educatorUser) => {
        if (!educatorUser?.email) return;
        return db.User.findOne({ where: { wallet_address: req.auth.wallet.toLowerCase() }, attributes: ["name", "lastname"] })
          .then((studentUser) => notifyEducator({
            to: educatorUser.email,
            educatorName: educatorUser.name || null,
            studentName: [studentUser?.name, studentUser?.lastname].filter(Boolean).join(" ") || null,
            stage: req.params.stage,
          }));
      })
      .catch((err) => console.error("[email] payment-proof-submitted: error:", err));

    return res.status(201).json(result.data);
  } catch (err) {
    console.error("POST /class-requests/:id/payments/:stage error:", err);
    return res.status(500).json({ error: "Failed to submit payment proof" });
  }
});

// PATCH /api/class-requests/:id/payments/:stage/confirm — educator confirms
router.patch("/:id/payments/:stage/confirm", authenticate, async (req, res) => {
  if (req.auth.role !== "issuer") {
    return res.status(403).json({ error: "Only educators can confirm payments" });
  }
  if (!VALID_STAGES.includes(req.params.stage)) {
    return res.status(400).json({ error: "INVALID_STAGE" });
  }

  try {
    const result = await confirmPaymentReceived({
      models: db,
      requestId: req.params.id,
      issuerWallet: req.auth.wallet,
      stage: req.params.stage,
    });

    if (!result.ok) return res.status(result.httpStatus).json({ error: result.code });

    db.User.findOne({ where: { wallet_address: result.data.student_wallet_address?.toLowerCase() }, attributes: ["email", "name"] })
      .then((studentUser) => {
        if (!studentUser?.email) return;
        return db.Issuer.findOne({ where: { wallet_address: req.auth.wallet.toLowerCase() }, attributes: ["organization_name"] })
          .then((educatorProfile) => notifyTalentPaymentConfirmed({
            to: studentUser.email,
            studentName: studentUser.name || null,
            educatorName: educatorProfile?.organization_name || null,
            stage: req.params.stage,
          }));
      })
      .catch((err) => console.error("[email] payment-confirmed: error:", err));

    return res.json(result.data);
  } catch (err) {
    console.error("PATCH /class-requests/:id/payments/:stage/confirm error:", err);
    return res.status(500).json({ error: "Failed to confirm payment" });
  }
});

// PATCH /api/class-requests/:id/payments/:stage/dispute — talent opens a dispute
router.patch("/:id/payments/:stage/dispute", authenticate, async (req, res) => {
  if (req.auth.role !== "student") {
    return res.status(403).json({ error: "Only students can open a payment dispute" });
  }
  if (!VALID_STAGES.includes(req.params.stage)) {
    return res.status(400).json({ error: "INVALID_STAGE" });
  }

  try {
    const result = await openPaymentDispute({
      models: db,
      requestId: req.params.id,
      studentWallet: req.auth.wallet,
      stage: req.params.stage,
    });

    if (!result.ok) return res.status(result.httpStatus).json({ error: result.code });

    getAdminEmails(db.User)
      .then((adminEmails) =>
        db.User.findOne({ where: { wallet_address: req.auth.wallet.toLowerCase() }, attributes: ["name", "lastname"] })
          .then((studentUser) => notifyPaymentDisputeOpened({
            to: adminEmails,
            studentName: [studentUser?.name, studentUser?.lastname].filter(Boolean).join(" ") || null,
            educatorName: null,
            stage: req.params.stage,
            requestId: req.params.id,
          }))
      )
      .catch((err) => console.error("[email] payment-dispute-opened: error:", err));

    return res.status(201).json(result.data);
  } catch (err) {
    console.error("PATCH /class-requests/:id/payments/:stage/dispute error:", err);
    return res.status(500).json({ error: "Failed to open dispute" });
  }
});

module.exports = router;
