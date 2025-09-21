// backend/routes/issuers.js
const express = require("express");
const router = express.Router();
const { Issuer, User, Certificate } = require("../models");

// GET /api/issuers
router.get("/", async (req, res) => {
  try {
    const issuers = await Issuer.findAll({
      include: [{
        model: User,
        attributes: ['id', 'wallet_address', 'name', 'lastname', 'email', 'is_active', 'created_at']
      }]
    });

    res.json({
      issuers: issuers.map(issuer => ({
        id: issuer.id,
        wallet_address: issuer.wallet_address,
        organization_name: issuer.organization_name,
        user: issuer.User,
        created_at: issuer.created_at
      }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch issuers" });
  }
});

// GET /api/issuers/:wallet_address
router.get("/:wallet_address", async (req, res) => {
  try {
    const { wallet_address } = req.params;

    const issuer = await Issuer.findOne({
      where: { wallet_address },
      include: [
        {
          model: User,
          attributes: ['id', 'wallet_address', 'name', 'lastname', 'email', 'is_active', 'created_at']
        },
        {
          model: Certificate,
          attributes: ['id', 'title', 'description', 'issue_date', 'is_revoked', 'created_at']
        }
      ]
    });

    if (!issuer) {
      return res.status(404).json({ error: "Issuer not found" });
    }

    res.json({
      issuer: {
        id: issuer.id,
        wallet_address: issuer.wallet_address,
        organization_name: issuer.organization_name,
        user: issuer.User,
        certificates: issuer.Certificates,
        created_at: issuer.created_at
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch issuer" });
  }
});

// PUT /api/issuers/:wallet_address
router.put("/:wallet_address", async (req, res) => {
  try {
    const { wallet_address } = req.params;
    const { organization_name } = req.body;

    const issuer = await Issuer.findOne({ where: { wallet_address } });
    if (!issuer) {
      return res.status(404).json({ error: "Issuer not found" });
    }

    await issuer.update({ organization_name });

    res.json({ message: "Issuer updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update issuer" });
  }
});

module.exports = router;
