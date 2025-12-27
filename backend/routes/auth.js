// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const axios = require("axios");

const userService = require("../services/userService");
const { signToken, authenticate, getUserFromToken } = require("../middleware/auth");
require("dotenv").config();

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "10", 10);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// Rate limiter for login — small window + few requests to slow brute-force
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 8, // max requests per ip per window
  message: { error: "Too many login attempts, slow down" },
});

/**
 * Optional: Cloudflare Turnstile verification
 * If FRONTEND sends 'cfToken' in body and env TURNSTILE_SECRET is set, we verify it.
 */
async function verifyCaptchaIfNeeded(cfToken) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return { ok: true };
  if (!cfToken) return { ok: false, error: "Missing captcha token" };

  try {
    const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", cfToken);
    const resp = await axios.post(url, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return { ok: resp.data.success, data: resp.data };
  } catch (err) {
    console.error("Captcha verify error:", err?.response?.data || err.message || err);
    return { ok: false, error: "Captcha verification failed" };
  }
}

/**
 * POST /api/auth/login
 */
router.post(
  "/login",
  loginLimiter,
  [
    body("wallet_address")
      .isString()
      .isLength({ min: 42, max: 42 })
      .withMessage("Valid wallet address required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { wallet_address } = req.body;

      // // captcha if env configured
      // const captcha = await verifyCaptchaIfNeeded(cfToken); ///////////////////////
      // if (!captcha.ok) return res.status(403).json({ error: captcha.error || "Captcha failed" }); ////////////
      
      const found = await userService.findUserByWallet(wallet_address.toLowerCase());
      if (!found) {
        return res.status(404).json({
          error: "No user associated with this wallet",
        });
      }

      const { modelName, user } = found;

      const payload = { sub: user.id, role: modelName, wallet: wallet_address };
      const token = signToken(payload);

      // // sanitize user
      const out = user.toJSON ? user.toJSON() : { ...user };
      delete out.passwordHash;//////////////////////////////////////////
      delete out.privateKey;//////////////////////////////////

      return res.json({
        message: "Authenticated",
        token,
        user: {
          id: out.id,
          email: out.email || null,
          role: modelName,
          wallet_address: wallet_address,
        }
      })
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/auth/change-password
 * Protected route: requires current password + new password
 * Body: { currentPassword, newPassword }
 */
router.post(
  "/change-password",
  authenticate,
  [
    body("currentPassword").isString().isLength({ min: 6 }).withMessage("Current password required"),
    body("newPassword").isString().isLength({ min: 8 }).withMessage("New password must be at least 8 chars"),
  ],
  async (req, res) => {
    try {
      const auth = req.auth;
      if (!auth) return res.status(401).json({ error: "Not authenticated" });

      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { currentPassword, newPassword } = req.body;
      const result = await userService.getUserByIdAndRole(auth.sub, auth.role);
      if (!result) return res.status(404).json({ error: "User not found" });

      const { user, modelName } = result;
      const match = await bcrypt.compare(currentPassword, user.passwordHash || "");
      if (!match) return res.status(401).json({ error: "Current password incorrect" });

      // hash new password and update
      const salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS || "10", 10));
      const newHash = await bcrypt.hash(newPassword, salt);

      // update directly via model instance
      await user.update({ passwordHash: newHash });

      return res.json({ message: "Password updated" });
    } catch (err) {
      console.error("change-password error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/auth/me
 * - Protected, returns sanitized user via getUserFromToken
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    const authPayload = req.auth;
    const result = await getUserFromToken(authPayload);
    if (!result) return res.status(404).json({ error: "User not found" });
    return res.json({ user: result.user, role: result.modelName });
  } catch (err) {
    console.error("GET /me error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
