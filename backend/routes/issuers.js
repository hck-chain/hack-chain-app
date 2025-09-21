// backend/routes/issuers.js
const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const bcrypt = require("bcrypt");
const { Issuer } = require("../models");

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "10", 10);
const RETURN_PRIVATE_KEY = process.env.RETURN_PRIVATE_KEY_ON_REGISTER === "true";

/**
 * POST /api/issuer/register
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email) return res.status(400).json({ error: "Email required" });
    if (!password) return res.status(400).json({ error: "Password required (min 8 chars recommended)" });
    if (!name) return res.status(400).json({ error: "Company name required" });

    // Check existing
    const existingByEmail = await Issuer.findOne({ where: { email } });
    if (existingByEmail) return res.status(409).json({ error: "Issuer already registered with that email" });

    const existingByName = await Issuer.findOne({ where: { name } });
    if (existingByName) return res.status(409).json({ error: "Issuer already registered with that name" });

    // Create wallet (in-memory)
    const newWallet = ethers.Wallet.createRandom();

    // Hash password
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create issuer without storing privateKey
    const newIssuer = await Issuer.create({
      name,
      email,
      passwordHash,
      walletAddress: newWallet.address
    });

    const responseIssuer = {
      id: newIssuer.id,
      email: newIssuer.email,
      name: newIssuer.name,
      walletAddress: newIssuer.walletAddress
    };

    if (RETURN_PRIVATE_KEY) {
      responseIssuer.privateKey = newWallet.privateKey;
      responseIssuer.mnemonic = newWallet.mnemonic?.phrase ?? null;
      responseIssuer.warning = "This private key is shown because RETURN_PRIVATE_KEY_ON_REGISTER=true. Do NOT share it. It is not stored on the server.";
    }

    return res.status(201).json({
      message: "Issuer registered",
      issuer: responseIssuer
    });
  } catch (err) {
    console.error("Register issuer error:", err);
    return res.status(500).json({ error: "Failed to register issuer" });
  }
});

module.exports = router;
