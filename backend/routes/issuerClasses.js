const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const db = require("../models");
const { authenticate } = require("../middleware/auth");
const { createIssuerClass } = require("../usecases/classes/createIssuerClass");
const { updateIssuerClass } = require("../usecases/classes/updateIssuerClass");
const { deleteIssuerClass } = require("../usecases/classes/deleteIssuerClass");

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many requests" },
});

// GET /api/issuer-classes/by-wallet/:wallet — public
router.get("/by-wallet/:wallet", publicLimiter, async (req, res) => {
  try {
    const classes = await db.IssuerClass.findAll({
      where: { issuer_wallet_address: req.params.wallet.toLowerCase(), is_active: true },
      attributes: ["id", "name", "description", "topics"],
      order: [["created_at", "ASC"]],
    });
    return res.json({ classes });
  } catch (err) {
    console.error("GET /issuer-classes/by-wallet error:", err);
    return res.status(500).json({ error: "Failed to fetch classes" });
  }
});

// GET /api/issuer-classes/mine
router.get("/mine", authenticate, async (req, res) => {
  if (req.auth.role !== "issuer") {
    return res.status(403).json({ error: "Only educators can access this endpoint" });
  }

  try {
    const classes = await db.IssuerClass.findAll({
      where: { issuer_wallet_address: req.auth.wallet.toLowerCase() },
      attributes: ["id", "name", "description", "topics", "is_active", "created_at"],
      order: [["created_at", "ASC"]],
    });
    return res.json({ classes });
  } catch (err) {
    console.error("GET /issuer-classes/mine error:", err);
    return res.status(500).json({ error: "Failed to fetch classes" });
  }
});

// POST /api/issuer-classes
router.post("/", authenticate, async (req, res) => {
  if (req.auth.role !== "issuer") {
    return res.status(403).json({ error: "Only educators can create classes" });
  }

  try {
    const result = await createIssuerClass({
      models: db,
      issuerWallet: req.auth.wallet,
      name: req.body.name,
      description: req.body.description,
      topics: req.body.topics,
    });

    if (!result.ok) return res.status(result.httpStatus).json({ error: result.code });
    return res.status(201).json(result.data);
  } catch (err) {
    console.error("POST /issuer-classes error:", err);
    return res.status(500).json({ error: "Failed to create class" });
  }
});

// PATCH /api/issuer-classes/:id
router.patch("/:id", authenticate, async (req, res) => {
  if (req.auth.role !== "issuer") {
    return res.status(403).json({ error: "Only educators can update classes" });
  }

  try {
    const result = await updateIssuerClass({
      models: db,
      classId: req.params.id,
      issuerWallet: req.auth.wallet,
      updates: {
        name: req.body.name,
        description: req.body.description,
        topics: req.body.topics,
        is_active: req.body.is_active,
      },
    });

    if (!result.ok) return res.status(result.httpStatus).json({ error: result.code });
    return res.json(result.data);
  } catch (err) {
    console.error("PATCH /issuer-classes/:id error:", err);
    return res.status(500).json({ error: "Failed to update class" });
  }
});

// DELETE /api/issuer-classes/:id
router.delete("/:id", authenticate, async (req, res) => {
  if (req.auth.role !== "issuer") {
    return res.status(403).json({ error: "Only educators can delete classes" });
  }

  try {
    const result = await deleteIssuerClass({
      models: db,
      classId: req.params.id,
      issuerWallet: req.auth.wallet,
    });

    if (!result.ok) return res.status(result.httpStatus).json({ error: result.code });
    return res.status(204).send();
  } catch (err) {
    console.error("DELETE /issuer-classes/:id error:", err);
    return res.status(500).json({ error: "Failed to delete class" });
  }
});

module.exports = router;
