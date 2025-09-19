// backend/routes/recruiters.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { Recruiter } = require("../models");

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "10", 10);

/**
 * POST /api/recruiter/register
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, lastName } = req.body;

    if (!email) return res.status(400).json({ error: "Email required" });
    if (!password) return res.status(400).json({ error: "Password required (min 8 chars recommended)" });
    if (!name) return res.status(400).json({ error: "Recruiter's name required" });
    if (!lastName) return res.status(400).json({ error: "Recruiter's last name required" });

    const existingByEmail = await Recruiter.findOne({ where: { email } });
    if (existingByEmail) return res.status(409).json({ error: "Recruiter already registered with that email" });

    // Hash password
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(password, salt);

    const newRecruiter = await Recruiter.create({
      name,
      lastName,
      email,
      passwordHash
    });

    return res.status(201).json({
      message: "Recruiter registered",
      recruiter: {
        id: newRecruiter.id,
        email: newRecruiter.email,
        name: newRecruiter.name,
        lastName: newRecruiter.lastName
      }
    });
  } catch (err) {
    console.error("Register recruiter error:", err);
    return res.status(500).json({ error: "Failed to register recruiter" });
  }
});

module.exports = router;
