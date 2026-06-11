// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const axios = require("axios");

const { ethers } = require("ethers");
const userService = require("../services/userService");
const { signToken, signRefreshToken, setAuthCookies, setAccessCookie, clearAuthCookies, verifyRefreshToken, authenticate, getUserFromToken } = require("../middleware/auth");
const { User, UserSession } = require("../models");
const { Op } = require('sequelize');
const { cacheSession, deleteSession, getRedis } = require("../services/redis");
const { RedisStore } = require("rate-limit-redis");
const { sendVerificationEmail } = require("../services/emailService");
require("dotenv").config();

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "10", 10);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const buildSignMessage = (address, nonce) =>
  `HackChain wants you to sign in with your Ethereum account:\n${address}\n\nSign in to HackChain\n\nNonce: ${nonce}`;

// Rate limiter for login — small window + few requests to slow brute-force
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  message: { error: "Too many login attempts, slow down" },
  store: new RedisStore({
    sendCommand: (...args) => getRedis().call(...args),
    prefix: "rl:login:",
  }),
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
    body("signature")
      .isString()
      .isLength({ min: 132 })
      .withMessage("Valid signature required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { wallet_address, signature } = req.body;
      const normalizedWallet = wallet_address.toLowerCase();

      const baseUser = await User.findOne({ where: { wallet_address: normalizedWallet } });
      if (!baseUser) {
        return res.status(404).json({ error: "No user associated with this wallet" });
      }

      const message = buildSignMessage(normalizedWallet, baseUser.nonce);

      let recoveredAddress;
      try {
        recoveredAddress = ethers.verifyMessage(message, signature);
      } catch {
        return res.status(401).json({ error: "Invalid signature" });
      }

      if (recoveredAddress.toLowerCase() !== normalizedWallet) {
        return res.status(401).json({ error: "Signature does not match wallet address" });
      }

      await baseUser.update({ nonce: crypto.randomBytes(16).toString('hex') });

      const found = await userService.findUserByWallet(normalizedWallet);
      const { modelName, user } = found;

      const payload = { sub: user.id, role: modelName, wallet: normalizedWallet };
      const token = signToken(payload);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await UserSession.destroy({ where: { wallet_address: normalizedWallet } });
      await UserSession.create({
        id: crypto.randomUUID(),
        wallet_address: normalizedWallet,
        expires_at: expiresAt,
      });

      const accessTtl = Math.floor((new Date(jwt.decode(token).exp * 1000) - Date.now()) / 1000);
      await cacheSession(normalizedWallet, accessTtl);

      const refreshToken = signRefreshToken(payload);
      setAuthCookies(res, token, refreshToken);

      const out = user.toJSON ? user.toJSON() : { ...user };
      delete out.passwordHash;
      delete out.privateKey;

      return res.json({
        message: "Authenticated",
        user: {
          id: out.id,
          email: out.email || null,
          role: modelName,
          wallet_address: normalizedWallet,
        },
      });
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
    const result = await getUserFromToken(req.auth); // req.auth tiene wallet
    if (!result) return res.status(404).json({ error: "User not found" });

    res.json(result); // esto ya incluye email
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

/**
 * POST /api/auth/logout
 * Destroys the active DB session, invalidating the JWT immediately.
 */
router.post("/logout", authenticate, async (req, res) => {
  try {
    const wallet = req.auth.wallet.toLowerCase();
    await Promise.all([
      UserSession.destroy({ where: { wallet_address: wallet } }),
      deleteSession(wallet),
    ]);
    clearAuthCookies(res);
    return res.json({ message: "Logged out" });
  } catch (err) {
    console.error("logout error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/auth/verify-email?token=xxx
 * Marks the user as email_verified and clears the token.
 */
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Token requerido" });
    }

    const user = await User.findOne({ where: { verification_token: hashToken(token) } });
    if (!user) {
      return res.status(400).json({ error: "Token inválido o ya utilizado" });
    }

    if (user.verification_token_expires_at < new Date()) {
      return res.status(400).json({ error: "El token expiró. Solicitá uno nuevo." });
    }

    await user.update({
      email_verified: true,
      verification_token: null,
      verification_token_expires_at: null,
    });

    return res.json({ message: "Email verificado correctamente" });
  } catch (err) {
    console.error("verify-email error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resends the verification email (rate-limited).
 */
const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Demasiados intentos, esperá un rato" },
});

router.post("/resend-verification", authenticate, resendLimiter, async (req, res) => {
  try {
    const wallet = req.auth.wallet.toLowerCase();
    const user = await User.findOne({ where: { wallet_address: wallet } });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    if (user.email_verified) {
      return res.status(400).json({ error: "El email ya está verificado" });
    }

    if (!user.email) {
      return res.status(400).json({ error: "No hay email registrado" });
    }

    const newToken = crypto.randomBytes(48).toString("hex");
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await user.update({
      verification_token: hashToken(newToken),
      verification_token_expires_at: newExpiry,
    });

    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name || null,
        token: newToken,
      });
    } catch (emailErr) {
      console.error("Resend API error:", emailErr?.message || emailErr);
      return res.status(502).json({ error: `Error al enviar el email: ${emailErr?.message || 'provider error'}` });
    }

    return res.json({ message: "Email de verificación reenviado" });
  } catch (err) {
    console.error("resend-verification error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/refresh
 * Issues a new access token cookie using the refresh token cookie.
 */
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token" });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    if (payload.type !== 'refresh') {
      return res.status(401).json({ error: "Invalid token type" });
    }

    const wallet = payload.wallet.toLowerCase();

    const session = await UserSession.findOne({
      where: {
        wallet_address: wallet,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!session) {
      clearAuthCookies(res);
      return res.status(401).json({ error: "Session expired" });
    }

    // Re-fetch the user's current ID from the DB so a stale refresh token
    // (issued before a data migration or account re-creation) never injects
    // a non-existent sub into the new access token.
    const currentUser = await User.findOne({
      where: { wallet_address: wallet },
      attributes: ['id', 'role'],
    });
    if (!currentUser) {
      clearAuthCookies(res);
      return res.status(401).json({ error: "User no longer exists" });
    }

    const newAccessToken = signToken({
      sub: currentUser.id,
      role: currentUser.role,
      wallet,
    });

    const ttl = Math.floor((new Date(jwt.decode(newAccessToken).exp * 1000) - Date.now()) / 1000);
    await cacheSession(wallet, ttl).catch(() => {});

    setAccessCookie(res, newAccessToken);
    return res.json({ message: "Token refreshed" });
  } catch (err) {
    console.error("refresh error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
