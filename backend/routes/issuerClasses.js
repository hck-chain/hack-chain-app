const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { IssuerClass } = require("../models");
const { authenticate } = require("../middleware/auth");

const MAX_CLASSES_PER_ISSUER = 20;
const MAX_TOPICS_PER_CLASS = 10;

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many requests" },
});

// GET /api/issuer-classes/by-wallet/:wallet — public, active classes for a wallet
router.get("/by-wallet/:wallet", publicLimiter, async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();
    const classes = await IssuerClass.findAll({
      where: { issuer_wallet_address: wallet, is_active: true },
      attributes: ["id", "name", "description", "topics"],
      order: [["created_at", "ASC"]],
    });
    res.json({ classes });
  } catch (err) {
    console.error("GET /issuer-classes/by-wallet error:", err);
    res.status(500).json({ error: "Failed to fetch classes" });
  }
});

// GET /api/issuer-classes/mine — educator sees all their classes (including inactive)
router.get("/mine", authenticate, async (req, res) => {
  try {
    if (req.auth.role !== "issuer") {
      return res.status(403).json({ error: "Only educators can access this endpoint" });
    }

    const classes = await IssuerClass.findAll({
      where: { issuer_wallet_address: req.auth.wallet.toLowerCase() },
      attributes: ["id", "name", "description", "topics", "is_active", "created_at"],
      order: [["created_at", "ASC"]],
    });

    res.json({ classes });
  } catch (err) {
    console.error("GET /issuer-classes/mine error:", err);
    res.status(500).json({ error: "Failed to fetch classes" });
  }
});

// POST /api/issuer-classes — educator creates a class
router.post("/", authenticate, async (req, res) => {
  try {
    if (req.auth.role !== "issuer") {
      return res.status(403).json({ error: "Only educators can create classes" });
    }

    const { name, description, topics } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Class name is required" });
    }

    const count = await IssuerClass.count({
      where: { issuer_wallet_address: req.auth.wallet.toLowerCase() },
    });

    if (count >= MAX_CLASSES_PER_ISSUER) {
      return res.status(400).json({ error: `Maximum ${MAX_CLASSES_PER_ISSUER} classes allowed` });
    }

    const sanitizedTopics = Array.isArray(topics)
      ? topics
          .map((t) => String(t).trim())
          .filter(Boolean)
          .slice(0, MAX_TOPICS_PER_CLASS)
      : [];

    const newClass = await IssuerClass.create({
      issuer_wallet_address: req.auth.wallet.toLowerCase(),
      name: String(name).trim().slice(0, 255),
      description: description ? String(description).trim().slice(0, 1000) : null,
      topics: sanitizedTopics,
      is_active: true,
    });

    res.status(201).json({
      id: newClass.id,
      name: newClass.name,
      description: newClass.description,
      topics: newClass.topics,
      is_active: newClass.is_active,
    });
  } catch (err) {
    console.error("POST /issuer-classes error:", err);
    res.status(500).json({ error: "Failed to create class" });
  }
});

// PATCH /api/issuer-classes/:id — educator updates a class
router.patch("/:id", authenticate, async (req, res) => {
  try {
    if (req.auth.role !== "issuer") {
      return res.status(403).json({ error: "Only educators can update classes" });
    }

    const issuerClass = await IssuerClass.findOne({
      where: { id: req.params.id, issuer_wallet_address: req.auth.wallet.toLowerCase() },
    });

    if (!issuerClass) {
      return res.status(404).json({ error: "Class not found" });
    }

    const { name, description, topics, is_active } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ error: "Class name cannot be empty" });
      updates.name = String(name).trim().slice(0, 255);
    }
    if (description !== undefined) {
      updates.description = description ? String(description).trim().slice(0, 1000) : null;
    }
    if (topics !== undefined) {
      updates.topics = Array.isArray(topics)
        ? topics.map((t) => String(t).trim()).filter(Boolean).slice(0, MAX_TOPICS_PER_CLASS)
        : [];
    }
    if (is_active !== undefined) {
      updates.is_active = Boolean(is_active);
    }

    await issuerClass.update(updates);
    res.json({
      id: issuerClass.id,
      name: issuerClass.name,
      description: issuerClass.description,
      topics: issuerClass.topics,
      is_active: issuerClass.is_active,
    });
  } catch (err) {
    console.error("PATCH /issuer-classes/:id error:", err);
    res.status(500).json({ error: "Failed to update class" });
  }
});

// DELETE /api/issuer-classes/:id — educator deletes a class
router.delete("/:id", authenticate, async (req, res) => {
  try {
    if (req.auth.role !== "issuer") {
      return res.status(403).json({ error: "Only educators can delete classes" });
    }

    const issuerClass = await IssuerClass.findOne({
      where: { id: req.params.id, issuer_wallet_address: req.auth.wallet.toLowerCase() },
    });

    if (!issuerClass) {
      return res.status(404).json({ error: "Class not found" });
    }

    await issuerClass.destroy();
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /issuer-classes/:id error:", err);
    res.status(500).json({ error: "Failed to delete class" });
  }
});

module.exports = router;
