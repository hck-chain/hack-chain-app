const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const db = require("../models");
const config = require("../harjoot/config");
const { authenticate } = require("../middleware/auth");
const { ensureReferralCode } = require("../usecases/referrals/ensureReferralCode");
const { validateReferralCode } = require("../usecases/referrals/validateReferralCode");
const { listMyReferrals } = require("../usecases/referrals/listMyReferrals");
const { getReferralStats } = require("../usecases/referrals/getReferralStats");

// Rate limit for public validate endpoint: 30/min/IP
const validateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many validation attempts" }
});

// GET /api/referrals/validate/:code
router.get("/validate/:code", validateLimiter, async (req, res) => {
  try {
    const code = req.params.code;
    const cleanCode = (code || "").trim().toUpperCase();
    
    // Malformed code -> 400
    if (!/^[0-9A-HJ-NP-TV-Z]{8}$/.test(cleanCode)) {
       return res.status(400).json({ valid: false, error: "malformed" });
    }

    const result = await validateReferralCode({ models: db, code: cleanCode });
    
    // Not found -> 404
    if (!result.valid) {
      return res.status(404).json({ valid: false, error: "not_found" });
    }
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to validate code" });
  }
});

// All following routes require authentication
router.use(authenticate);

// GET /api/referrals/me/code
router.get("/me/code", async (req, res) => {
  try {
    const user = await db.User.findByPk(req.auth.sub);
    if (!user) return res.status(404).json({ error: "User not found" });

    const result = await ensureReferralCode({ models: db, user });
    if (!result.ok) {
      return res.status(500).json({ error: "Could not generate code" });
    }
    
    const frontendUrl = process.env.FRONTEND_URL || "https://hackchain.app";
    const shareUrl = `${frontendUrl}/register?ref=${result.code}`;

    res.json({ code: result.code, shareUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get code" });
  }
});

// GET /api/referrals/me
router.get("/me", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    
    const result = await listMyReferrals({ 
      models: db, 
      userId: req.auth.sub, 
      page, 
      pageSize, 
      config 
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list referrals" });
  }
});

// GET /api/referrals/me/stats
router.get("/me/stats", async (req, res) => {
  try {
    const result = await getReferralStats({ 
      models: db, 
      userId: req.auth.sub, 
      config 
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

module.exports = router;
