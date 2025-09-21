// backend/routes/students.js
const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const bcrypt = require("bcrypt");
const { Student } = require("../models");

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "10", 10);
const RETURN_PRIVATE_KEY = process.env.RETURN_PRIVATE_KEY_ON_REGISTER === "true";

/**
 * POST /api/student/register
 * - Validates body minimally
 * - Hashes password explicitly
 * - Creates wallet in-memory, stores walletAddress only
 * - Optionally returns privateKey in response if RETURN_PRIVATE_KEY_ON_REGISTER=true (NOT recommended for production)
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, lastName, age } = req.body;

    if (!email) return res.status(400).json({ error: "Email required" });
    if (!password) return res.status(400).json({ error: "Password required (min 8 chars recommended)" });
    if (!name) return res.status(400).json({ error: "Name required" });
    if (!lastName) return res.status(400).json({ error: "Last name required" });
    if (age === undefined || age === null) return res.status(400).json({ error: "Age required" });

    // Check if student already exists
    const existing = await Student.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: "Student already registered" });

    // Generate wallet (in-memory)
    const newWallet = ethers.Wallet.createRandom();

    // Hash password explicitly
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create student record - DO NOT store privateKey
    const newStudent = await Student.create({
      name,
      lastName,
      age,
      email,
      passwordHash,
      walletAddress: newWallet.address
      // privateKey intentionally omitted
    });

    // Build response
    const responseStudent = {
      id: newStudent.id,
      name: newStudent.name,
      lastName: newStudent.lastName,
      age: newStudent.age,
      email: newStudent.email,
      walletAddress: newStudent.walletAddress
    };

    // Optionally include privateKey in response (dangerous; disabled by default)
    if (RETURN_PRIVATE_KEY) {
      responseStudent.privateKey = newWallet.privateKey;
      responseStudent.mnemonic = newWallet.mnemonic?.phrase ?? null;
      responseStudent.warning = "This private key is shown because RETURN_PRIVATE_KEY_ON_REGISTER=true. Do NOT share it. It is not stored on the server.";
    }

    return res.status(201).json({
      message: "Student registered",
      student: responseStudent
    });
  } catch (err) {
    console.error("Register student error:", err);
    return res.status(500).json({ error: "Failed to register student" });
  }
});

module.exports = router;
