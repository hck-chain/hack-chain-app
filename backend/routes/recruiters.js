// backend/routes/recruiters.js
const express = require("express");
const router = express.Router();
const { Recruiter, User, Student } = require("../models");
const { where } = require("sequelize");
const { authenticate } = require("../middleware/auth");

// GET /api/recruiters
router.get("/", async (req, res) => {
  try {
    const recruiters = await Recruiter.findAll({
      include: [{
        model: User,
        attributes: ['id', 'wallet_address', 'name', 'lastname', 'email', 'is_active', 'created_at']
      }]
    });

    res.json({
      recruiters: recruiters.map(recruiter => ({
        id: recruiter.id,
        wallet_address: recruiter.wallet_address,
        company_name: recruiter.company_name,
        user: recruiter.User,
        created_at: recruiter.created_at
      }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch recruiters" });
  }
});

// POST /api/recruiters/dashboard
router.post("/dashboard", authenticate, async (req, res) => {
  if (req.auth.role !== 'recruiter') {
    return res.status(403).json({ error: "Only recruiters can access the dashboard" });
  }

  try {
    const recruiter = await Recruiter.findOne({ where: { wallet_address: req.auth.wallet.toLowerCase() } });
    if (!recruiter) {
      return res.status(404).json({ error: "Recruiter not found" });
    }
    const students = await Student.findAll({
      include: [{
        model: User,
        attributes: ["name", "lastname"]
      }],
      attributes: [
        "field_of_study",
        "wallet_address",
        "created_at"
      ]
    });
    res.status(200).json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get students list" });
  }
});

// GET /api/recruiters/:wallet_address
router.get("/:wallet_address", async (req, res) => {
  try {
    const { wallet_address } = req.params;

    const recruiter = await Recruiter.findOne({
      where: { wallet_address: wallet_address.toLowerCase() },
      include: [{
        model: User,
        attributes: ['id', 'wallet_address', 'name', 'lastname', 'email', 'is_active', 'created_at']
      }]
    });

    if (!recruiter) {
      return res.status(404).json({ error: "Recruiter not found" });
    }

    res.json({
      recruiter: {
        id: recruiter.id,
        wallet_address: recruiter.wallet_address,
        company_name: recruiter.company_name,
        user: recruiter.User,
        created_at: recruiter.created_at
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch recruiter" });
  }
});

// PUT /api/recruiters/:wallet_address
router.put("/:wallet_address", authenticate, async (req, res) => {
  try {
    const { wallet_address } = req.params;
    const { company_name } = req.body;

    if (req.auth.wallet.toLowerCase() !== wallet_address.toLowerCase()) {
      return res.status(403).json({ error: "Cannot modify another recruiter's profile" });
    }

    const recruiter = await Recruiter.findOne({ where: { wallet_address: wallet_address.toLowerCase() } });
    if (!recruiter) {
      return res.status(404).json({ error: "Recruiter not found" });
    }

    await recruiter.update({ company_name });

    res.json({ message: "Recruiter updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update recruiter" });
  }
});

module.exports = router;
