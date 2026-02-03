const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { UserSession, User } = require("../models");

// POST /api/sessions - Create new session
router.post("/", async (req, res) => {
  try {
    const { wallet_address, expires_in_hours = 24 } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ error: "Wallet address required" });
    }

    // Check if user exists
    const user = await User.findOne({ where: { wallet_address } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: "User account is inactive" });
    }

    // Generate session ID
    const sessionId = crypto.randomUUID();

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expires_in_hours);

    // Create session
    const session = await UserSession.create({
      id: sessionId,
      wallet_address,
      expires_at: expiresAt
    });

    res.status(201).json({
      message: "Session created successfully",
      session: {
        id: session.id,
        wallet_address: session.wallet_address,
        expires_at: session.expires_at,
        created_at: session.created_at
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// GET /api/sessions/:session_id - Get session info
router.get("/:session_id", async (req, res) => {
  try {
    const { session_id } = req.params;

    const session = await UserSession.findByPk(session_id, {
      include: [{
        model: User,
        attributes: ['wallet_address', 'role', 'name', 'lastname', 'email', 'is_active']
      }]
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Check if session is expired
    const now = new Date();
    if (session.expires_at < now) {
      // Delete expired session
      await session.destroy();
      return res.status(401).json({ error: "Session expired" });
    }

    res.json({
      session: {
        id: session.id,
        wallet_address: session.wallet_address,
        expires_at: session.expires_at,
        created_at: session.created_at,
        user: session.User
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// DELETE /api/sessions/:session_id - Delete session (logout)
router.delete("/:session_id", async (req, res) => {
  try {
    const { session_id } = req.params;

    const session = await UserSession.findByPk(session_id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    await session.destroy();

    res.json({ message: "Session deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

// DELETE /api/sessions/user/:wallet_address - Delete all sessions for user
router.delete("/user/:wallet_address", async (req, res) => {
  try {
    const { wallet_address } = req.params;

    const deletedCount = await UserSession.destroy({
      where: { wallet_address }
    });

    res.json({
      message: `${deletedCount} sessions deleted successfully`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete sessions" });
  }
});

// DELETE /api/sessions/cleanup/expired - Clean up expired sessions
router.delete("/cleanup/expired", async (req, res) => {
  try {
    const now = new Date();

    const deletedCount = await UserSession.destroy({
      where: {
        expires_at: {
          [require('sequelize').Op.lt]: now
        }
      }
    });

    res.json({
      message: `${deletedCount} expired sessions cleaned up`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cleanup expired sessions" });
  }
});

module.exports = router;