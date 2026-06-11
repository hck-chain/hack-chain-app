const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const db = require("../models");
const { User, Student, Issuer, Recruiter, UserSession, sequelize } = require("../models");
const { signToken, signRefreshToken, setAuthCookies, authenticate } = require("../middleware/auth");
const { cacheSession } = require("../services/redis");
const { authorizeIssuer } = require("../services/authorizeIssuer");
const emailService = require("../services/emailService");
const { createHarjootClient } = require("../harjoot/client");
const { activateMembership } = require("../harjoot/usecases/activateMembership");
const { claimInvitation } = require("../harjoot/usecases/claimInvitation");
const { attachReferralOnRegister } = require("../usecases/referrals/attachReferralOnRegister");
const config = require("../harjoot/config");
const configReferrals = require("../config/referrals");

const isValidEthAddress = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr);

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many registration attempts, try later" },
});

// POST /api/users/register
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { wallet_address, role, name, lastname, email, organization_name, field_of_study, company_name } = req.body;

    if (!wallet_address || !isValidEthAddress(wallet_address)) {
      return res.status(400).json({ error: "Valid Ethereum wallet address required" });
    }

    const normalizedWallet = wallet_address.toLowerCase();

    const existingUser = await User.findOne({ where: { wallet_address: normalizedWallet } });
    if (existingUser) {
      return res.status(409).json({ error: "User already registered" });
    }

    switch (role) {
      case "student":
        if (!name || !lastname || !email) {
          return res.status(400).json({ error: "Missing student data" });
        }
        break;
      case "issuer":
        if (!organization_name || !email) {
          return res.status(400).json({ error: "Missing issuer data" });
        }
        break;
      case "recruiter":
        if (!name || !lastname || !email || !company_name) {
          return res.status(400).json({ error: "Missing recruiter data" });
        }
        break;
      default:
        return res.status(400).json({ error: "Invalid role" });
    }

    const nonce = crypto.randomBytes(16).toString("hex");
    const rawVerificationToken = crypto.randomBytes(48).toString("hex");
    const verificationToken = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    let newUser;
    let roleSpecificData;

    await sequelize.transaction(async (t) => {
      newUser = await User.create(
        {
          wallet_address: normalizedWallet, role, name, lastname, email, nonce, is_active: true,
          email_verified: false,
          verification_token: verificationToken,
          verification_token_expires_at: verificationTokenExpiresAt,
          // Issuers need explicit admin approval before they can issue certificates
          // (DS Section 2.5). The status flips to "approved" via routes/admin.js.
          educator_approval_status: role === "issuer" ? "pending_approval" : null,
        },
        { transaction: t }
      );

      if (role === "student") {
        roleSpecificData = await Student.create(
          { wallet_address: normalizedWallet, field_of_study: field_of_study || null },
          { transaction: t }
        );
      } else if (role === "issuer") {
        roleSpecificData = await Issuer.create(
          { wallet_address: normalizedWallet, organization_name },
          { transaction: t }
        );
        // Authorize on-chain — if this throws, the transaction rolls back and the user is NOT created
        await authorizeIssuer(normalizedWallet);
      } else if (role === "recruiter") {
        roleSpecificData = await Recruiter.create(
          { wallet_address: normalizedWallet, company_name },
          { transaction: t }
        );
      }

      // Referral attachment
      const ipHash = crypto.createHash('sha256').update((req.ip || '') + configReferrals.ipSaltPepper).digest('hex');
      const uaHash = crypto.createHash('sha256').update(req.headers['user-agent'] || '').digest('hex');
      
      const referralAttach = await attachReferralOnRegister({
        models: db, transaction: t,
        referrerCode: req.body.referral_code,
        referredUser: newUser,
        ipHash, userAgentHash: uaHash, now: new Date(),
      });
      if (!referralAttach.attached && referralAttach.reason !== 'no_code') {
        console.warn('[register] referral attach skipped:', referralAttach.reason);
      }
    });

    // DS Section 2 — Harjoot membership activation. Runs AFTER the registration
    // transaction commits so a Harjoot outage cannot abort the registration.
    // The use case never throws; failures are logged and the membership
    // middleware (Section 3) re-activates lazily on the first protected request.
    await activateMembership({
      client: createHarjootClient(),
      models: { User },
      role: newUser.role,
      user: newUser,
      profile: roleSpecificData,
    });

    // DS Section 5 — claim any pending educator invitations targeting this
    // wallet. Best effort: failures here (DB or email) must not block the
    // registration response. Only students can have claimable invites.
    if (newUser.role === "student") {
      try {
        await claimInvitation({
          models: db,
          emailService,
          studentWallet: newUser.wallet_address,
          studentUser: newUser,
        });
      } catch (err) {
        console.error("[register] claimInvitation failed:", err && err.message);
      }
    }

    const payload = { sub: newUser.id, role: newUser.role, wallet: newUser.wallet_address };
    const token = signToken(payload);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await UserSession.destroy({ where: { wallet_address: normalizedWallet } });
    await UserSession.create({
      id: crypto.randomUUID(),
      wallet_address: normalizedWallet,
      expires_at: expiresAt,
    });

    const ttl = Math.floor((new Date(jwt.decode(token).exp * 1000) - Date.now()) / 1000);
    await cacheSession(normalizedWallet, ttl);

    const refreshToken = signRefreshToken(payload);
    setAuthCookies(res, token, refreshToken);

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        wallet_address: newUser.wallet_address,
        role: newUser.role,
        name: newUser.name,
        lastname: newUser.lastname,
        email: newUser.email,
        is_active: newUser.is_active,
        email_verified: false,
      },
      roleData: roleSpecificData,
    });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ error: "Failed to register user" });
  }
});

// GET /api/users/:wallet_address
router.get("/:wallet_address", authenticate, async (req, res) => {
  try {
    const { wallet_address } = req.params;

    const user = await User.findOne({
      where: { wallet_address },
      include: [
        { model: Student, required: false },
        { model: Issuer, required: false },
        { model: Recruiter, required: false },
      ],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        role: user.role,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        is_active: user.is_active,
        created_at: user.created_at,
      },
      roleData: user.Student || user.Issuer || user.Recruiter || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// PUT /api/users/:wallet_address
router.put("/:wallet_address", authenticate, async (req, res) => {
  try {
    const { wallet_address } = req.params;
    const { name, lastname, email, field_of_study, organization_name, company_name } = req.body;

    if (req.auth.wallet.toLowerCase() !== wallet_address.toLowerCase()) {
      return res.status(403).json({ error: "Cannot modify another user's profile" });
    }

    const user = await User.findOne({ where: { wallet_address } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await user.update({
      name: name || user.name,
      lastname: lastname || user.lastname,
      email: email || user.email,
    });

    if (user.role === "student" && field_of_study !== undefined) {
      await Student.update({ field_of_study }, { where: { wallet_address } });
    } else if (user.role === "issuer" && organization_name !== undefined) {
      await Issuer.update({ organization_name }, { where: { wallet_address } });
    } else if (user.role === "recruiter" && company_name !== undefined) {
      await Recruiter.update({ company_name }, { where: { wallet_address } });
    }

    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// GET /api/users/:wallet_address/nonce — returns current challenge nonce for wallet login (public, read-only)
router.get("/:wallet_address/nonce", async (req, res) => {
  try {
    const { wallet_address } = req.params;

    const user = await User.findOne({ where: { wallet_address } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ nonce: user.nonce });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch nonce" });
  }
});

module.exports = router;
